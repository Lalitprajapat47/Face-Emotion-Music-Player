import { useEffect, useRef, useState } from "react";
import { detect, init } from "../utils/utils";
import "../style/face-expression.scss";

// How far the nose has to travel (as a fraction of face width) before a
// head turn counts as "flip the record".
const TURN_THRESHOLD = 0.11;
// ...and how long (ms) it has to be held before it fires.
const TURN_DWELL_MS = 90;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export default function FaceExpression({
  onClick = () => {},
  onHeadTurn = () => {},
  headHint = false,
  compact = false,
}) {
  const videoRef = useRef(null);
  const landmarkerRef = useRef(null);
  const streamRef = useRef(null);
  const portholeRef = useRef(null);

  const [expression, setExpression] = useState("Detecting...");
  const [badgePulse, setBadgePulse] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [initStatus, setInitStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [turnFlash, setTurnFlash] = useState(null);
  const rafRef = useRef(null);

  // ── Head control ─────────────────────────────────────────────────────
  const [headEnabled, setHeadEnabled] = useState(() => {
    try { return localStorage.getItem("moodify:headControl") !== "off"; } catch { return true; }
  });
  const headEnabledRef = useRef(headEnabled);
  const onHeadTurnRef = useRef(onHeadTurn);
  const flashTimerRef = useRef(null);
  const poseRef = useRef({ smooth: null, baseline: null, armed: true, lastTrigger: 0, overSince: null });

  useEffect(() => {
    headEnabledRef.current = headEnabled;
    try { localStorage.setItem("moodify:headControl", headEnabled ? "on" : "off"); } catch { /* storage unavailable */ }
  }, [headEnabled]);

  useEffect(() => {
    onHeadTurnRef.current = onHeadTurn;
  });

  // Called every video frame with the nose position between the cheek edges.
  // It only touches refs (and one rarely-used state setter), so the frame
  // loop below can safely keep a reference to the very first copy of it.
  function handlePose(pose) {
    const el = portholeRef.current;
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

    const enabled = headEnabledRef.current;
    // dev < 0 → user turned to *their* right (nose moves toward image-left).
    // The preview is mirrored, so that reads as "towards screen-right" = next.
    el?.style.setProperty("--yaw", enabled ? clamp(-dev / TURN_THRESHOLD, -1, 1).toFixed(3) : "0");
    if (!enabled) return;

    const now = performance.now();
    const over = Math.abs(dev) >= TURN_THRESHOLD;

    if (s.armed) {
      if (!over) {
        s.overSince = null;
      } else {
        // the turn has to be held for a moment — a one-frame landmark glitch
        // must not flip a record
        if (s.overSince == null) s.overSince = now;
        if (now - s.overSince >= TURN_DWELL_MS && now - s.lastTrigger > 700) {
          s.armed = false;             // must come back to centre before the next flip
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

  useEffect(() => () => clearTimeout(flashTimerRef.current), []);

  // ── Camera + model ───────────────────────────────────────────────────
  useEffect(() => {
    let mountedFlag = true;

    (async () => {
      const status = await init({ landmarkerRef, videoRef, streamRef });
      if (mountedFlag) {
        setInitStatus(status);
        if (!status.ok) {
          setExpression(status.error?.message || "Sensor Offline");
        }
        setMounted(true);
      }
    })();

    return () => {
      if (landmarkerRef.current) landmarkerRef.current.close();
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let active = true;
    function frame() {
      try {
        detect({ landmarkerRef, videoRef, setExpression, onPose: handlePose });
      } catch (e) {
        console.warn("detect loop error", e);
      }
      rafRef.current = requestAnimationFrame(frame);
    }

    if (initStatus?.ok && active) {
      rafRef.current = requestAnimationFrame(frame);
    }

    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [initStatus]);

  async function handleClick() {
    setIsProcessing(true);
    const detectedExpr = detect({ landmarkerRef, videoRef, setExpression });
    onClick(detectedExpr);
    setTimeout(() => setIsProcessing(false), 500);
  }

  useEffect(() => {
    if (!expression) return;
    setBadgePulse(true);
    const t = setTimeout(() => setBadgePulse(false), 600);
    return () => clearTimeout(t);
  }, [expression]);

  const KNOWN_MOODS = ["happy", "sad", "surprised", "neutral"];
  const currentClean = expression?.toLowerCase().trim();
  const moodKey = KNOWN_MOODS.includes(currentClean) ? currentClean : "detecting";
  const isLive = Boolean(initStatus?.ok);
  const headActive = headHint && headEnabled;

  // Sync global CSS variable for backdrop canvas laser sync
  useEffect(() => {
    if (KNOWN_MOODS.includes(moodKey)) {
      document.documentElement.style.setProperty(
        "--mood-current",
        `var(--mood-${moodKey})`
      );
    }
  }, [moodKey]);

  const cardMarkup = (
    <div className="porthole-unit" data-mood={moodKey}>
      <div
        ref={portholeRef}
        className={`porthole ${headActive ? "porthole--head" : ""}`}
      >
        <span className="porthole__ring" aria-hidden="true" />
        <div className="porthole__glass">
          <video ref={videoRef} className="porthole__video" playsInline autoPlay muted />
        </div>
        {isLive && <span className="porthole__live-tag">LIVE</span>}

        {/* Live head-turn meter: the chevrons brighten as the head turns and
            flash when a flip fires. */}
        <span
          className={`porthole__cue porthole__cue--prev ${turnFlash === "prev" ? "flash" : ""}`}
          aria-hidden="true"
        >‹</span>
        <span
          className={`porthole__cue porthole__cue--next ${turnFlash === "next" ? "flash" : ""}`}
          aria-hidden="true"
        >›</span>
      </div>

      <div className="readout">
        <span className="readout__vu" aria-hidden="true">
          <span /><span /><span /><span /><span />
        </span>
        <span className={`readout__mood ${badgePulse ? "pulse" : ""}`}>{expression}</span>
        <span className="readout__system">MediaPipe v1.0</span>
      </div>

      <button
        className={`needle-btn ${isProcessing ? "processing" : ""}`}
        onClick={handleClick}
        disabled={!isLive}
      >
        <span className="needle-btn__scan" aria-hidden="true" />
        {isProcessing ? "Synthesizing…" : "Detect expression"}
      </button>

      <button
        type="button"
        className={`head-toggle ${headEnabled ? "is-on" : ""}`}
        onClick={() => setHeadEnabled((v) => !v)}
        aria-pressed={headEnabled}
      >
        <span className="head-toggle__track"><span className="head-toggle__thumb" /></span>
        <span>Head control</span>
        {headActive && <span className="head-toggle__hint">turn left / right to flip records</span>}
      </button>
    </div>
  );

  if (compact) {
    return <div className={`expression-card-compact ${mounted ? "mounted" : ""}`}>{cardMarkup}</div>;
  }

  return (
    <section className={`expression-hero-wrap ${mounted ? "mounted" : ""}`}>
      {cardMarkup}
    </section>
  );
}