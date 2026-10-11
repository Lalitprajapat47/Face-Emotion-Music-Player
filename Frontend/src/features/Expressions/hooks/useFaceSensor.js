import { useCallback, useEffect, useRef, useState } from "react";
import { detect, init } from "../utils/utils";

// How far the nose has to travel (as a fraction of face width) before a head
// turn counts as "skip"...
const TURN_THRESHOLD = 0.11;
// ...and how long (ms) it has to be held before it fires.
const TURN_DWELL_MS = 90;
// Mood used for a mix = the most common reading over this window (ms).
const MOOD_WINDOW_MS = 500;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Current video frame -> square, mirrored (selfie-style) JPEG data URL. */
function grabSquareFrame(video, size = 640) {
  if (!video || !video.videoWidth || !video.videoHeight) return null;
  const side = Math.min(video.videoWidth, video.videoHeight);
  const sx = (video.videoWidth - side) / 2;
  const sy = (video.videoHeight - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.translate(size, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, sx, sy, side, side, 0, 0, size, size);

  try {
    return canvas.toDataURL("image/jpeg", 0.88);
  } catch {
    return null;
  }
}

function friendlyError(status) {
  const type = status?.error?.type;
  if (type === "camera") return "Camera access is blocked. Allow it in your browser and reload.";
  if (type === "model") return "Couldn't load the face model. Check your connection and reload.";
  return status?.error?.message || "Camera unavailable";
}

/**
 * Owns the camera, the MediaPipe model, the per-frame detection loop, the
 * head-turn gesture and the "capture a mood + snapshot" action.
 * Lives at page level so the camera keeps running while the UI switches
 * between the "look at the camera" and the "your mix" views.
 */
export function useFaceSensor({ headActive = false, onHeadTurn = () => {} } = {}) {
  const videoRef = useRef(null);
  const frameRef = useRef(null);       // element that receives the live --yaw value
  const landmarkerRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  const [expression, setExpression] = useState("Detecting...");
  const [status, setStatus] = useState(null);
  const [turnFlash, setTurnFlash] = useState(null);

  // ── recent mood readings (for a steadier capture) ─────────────────────
  const historyRef = useRef([]);
  const trackExpression = useCallback((value) => {
    const now = performance.now();
    const history = historyRef.current;
    history.push({ value, at: now });
    while (history.length && now - history[0].at > MOOD_WINDOW_MS) history.shift();
    setExpression(value);
  }, []);

  // ── head control ──────────────────────────────────────────────────────
  const [headEnabled, setHeadEnabled] = useState(() => {
    try { return localStorage.getItem("moodify:headControl") !== "off"; } catch { return true; }
  });
  const headEnabledRef = useRef(headEnabled);
  const headActiveRef = useRef(headActive);
  const onHeadTurnRef = useRef(onHeadTurn);
  const flashTimerRef = useRef(null);
  const poseRef = useRef({ smooth: null, baseline: null, armed: true, lastTrigger: 0, overSince: null });

  useEffect(() => {
    headEnabledRef.current = headEnabled;
    try { localStorage.setItem("moodify:headControl", headEnabled ? "on" : "off"); } catch { /* storage unavailable */ }
  }, [headEnabled]);

  useEffect(() => {
    headActiveRef.current = headActive;
    onHeadTurnRef.current = onHeadTurn;
  });

  useEffect(() => () => clearTimeout(flashTimerRef.current), []);

  // Called every video frame with the nose position between the cheek edges.
  // Only touches refs (plus one rarely-used state setter), so the frame loop
  // can safely keep the very first copy of it.
  function handlePose(pose) {
    const el = frameRef.current;
    const s = poseRef.current;

    if (!pose) {
      s.smooth = null;
      el?.style.setProperty("--yaw", "0");
      return;
    }

    s.smooth = s.smooth == null ? pose.ratio : s.smooth + (pose.ratio - s.smooth) * 0.35;
    if (s.baseline == null) s.baseline = s.smooth;

    const dev = s.smooth - s.baseline;
    // while roughly facing the screen, slowly re-centre the "neutral" point
    if (Math.abs(dev) < 0.05) s.baseline += dev * 0.02;

    const live = headEnabledRef.current && headActiveRef.current;
    // dev < 0 -> the user turned to *their* right (nose moves toward
    // image-left). The preview is mirrored, so that reads as "towards
    // screen-right" = next.
    el?.style.setProperty("--yaw", live ? clamp(-dev / TURN_THRESHOLD, -1, 1).toFixed(3) : "0");
    if (!live) {
      s.overSince = null;
      return;
    }

    const now = performance.now();
    const over = Math.abs(dev) >= TURN_THRESHOLD;

    if (s.armed) {
      if (!over) {
        s.overSince = null;
      } else {
        // the turn has to be held for a moment, so one glitchy landmark
        // frame can't skip a song
        if (s.overSince == null) s.overSince = now;
        if (now - s.overSince >= TURN_DWELL_MS && now - s.lastTrigger > 700) {
          s.armed = false;             // must come back to centre before the next skip
          s.overSince = null;
          s.lastTrigger = now;
          const direction = dev < 0 ? "next" : "prev";
          onHeadTurnRef.current?.(direction);
          setTurnFlash(direction);
          clearTimeout(flashTimerRef.current);
          flashTimerRef.current = setTimeout(() => setTurnFlash(null), 450);
        }
      }
    } else if (Math.abs(dev) < TURN_THRESHOLD * 0.45) {
      s.armed = true;
      s.overSince = null;
    }
  }

  // ── camera + model ────────────────────────────────────────────────────
  useEffect(() => {
    let mountedFlag = true;

    (async () => {
      const result = await init({ landmarkerRef, videoRef, streamRef });
      if (mountedFlag) setStatus(result);
    })();

    return () => {
      mountedFlag = false;
      if (landmarkerRef.current) landmarkerRef.current.close();
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!status?.ok) return undefined;
    let active = true;

    function frame() {
      if (!active) return;
      try {
        detect({ landmarkerRef, videoRef, setExpression: trackExpression, onPose: handlePose });
      } catch (e) {
        console.warn("detect loop error", e);
      }
      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [status, trackExpression]);

  /**
   * Reads the mood (majority of the last ~0.5s, slightly biased against
   * "Neutral") and grabs a snapshot of the camera. `expression` is null when
   * no face was seen recently.
   */
  const capture = useCallback(() => {
    const now = performance.now();
    const recent = historyRef.current.filter((h) => now - h.at <= MOOD_WINDOW_MS);

    let best = null;
    if (recent.length) {
      const counts = {};
      recent.forEach((h) => { counts[h.value] = (counts[h.value] || 0) + 1; });
      let bestScore = 0;
      Object.entries(counts).forEach(([value, count]) => {
        const score = value === "Neutral" ? count * 0.8 : count;
        if (score > bestScore) { best = value; bestScore = score; }
      });
    }

    return { expression: best, snapshot: grabSquareFrame(videoRef.current) };
  }, []);

  return {
    videoRef,
    frameRef,
    expression,
    isLive: Boolean(status?.ok),
    error: status && !status.ok ? friendlyError(status) : null,
    capture,
    headEnabled,
    setHeadEnabled,
    turnFlash,
  };
}