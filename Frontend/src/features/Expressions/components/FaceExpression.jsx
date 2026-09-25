import { useEffect, useRef, useState } from "react";
import { detect, init } from "../utils/utils";
import "../style/face-expression.scss";

export default function FaceExpression({ onClick = () => {}, compact = false }) {
  const videoRef = useRef(null);
  const landmarkerRef = useRef(null);
  const streamRef = useRef(null);

  const [expression, setExpression] = useState("Detecting...");
  const [badgePulse, setBadgePulse] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [initStatus, setInitStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const rafRef = useRef(null);

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
        detect({ landmarkerRef, videoRef, setExpression });
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
      <div className="porthole">
        <span className="porthole__ring" aria-hidden="true" />
        <div className="porthole__glass">
          <video ref={videoRef} className="porthole__video" playsInline autoPlay muted />
        </div>
        <span className={`porthole__status-dot ${isLive ? "live" : ""}`} />
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
        <span className="needle-btn__dot" />
        {isProcessing ? "Synthesizing…" : "Detect expression"}
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