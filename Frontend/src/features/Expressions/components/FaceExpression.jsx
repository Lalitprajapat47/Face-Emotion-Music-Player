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
    <div className="expression-card" data-mood={moodKey}>
      {/* Dynamic Laser Border Contour */}
      <div className="card-ambient-glow" />

      <div className="video-wrap">
        <video ref={videoRef} className="video-element" playsInline autoPlay muted />
        
        {/* Subtle Architectural Lens Guides */}
        <div className="reticle-marks">
          <span className="reticle top-l" />
          <span className="reticle top-r" />
          <span className="reticle btm-l" />
          <span className="reticle btm-r" />
        </div>
      </div>

      {/* Telemetry Row Strictly Below Video */}
      <div className="status-row">
        <div className="status-telemetry">
          <span className={`status-dot ${isLive ? "live" : ""}`} />
          <div className="status-labels">
            <span className="sub-tag">EXPRESSION</span>
            <span className={`main-val ${badgePulse ? "pulse" : ""}`}>
              {expression}
            </span>
          </div>
        </div>
        <span className="system-pill">MediaPipe v1.0</span>
      </div>

      {/* High-Aesthetic Prismatic Trigger Button */}
      <div className="controls">
        <button
          className={`btn-expression-trigger ${isProcessing ? "processing" : ""}`}
          onClick={handleClick}
          disabled={!isLive}
        >
          <div className="btn-ambient-fill" />
          <span className="btn-content">
            <span className="btn-icon">⚡</span>
            {isProcessing ? "Synthesizing..." : "Detect Expression"}
          </span>
          <div className="btn-beam-shine" />
        </button>
      </div>
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