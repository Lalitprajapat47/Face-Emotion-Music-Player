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
  const rafRef = useRef(null);

  useEffect(() => {
    let mountedFlag = true;

    (async () => {
      const status = await init({ landmarkerRef, videoRef, streamRef });
      if (mountedFlag) {
        setInitStatus(status);
        if (!status.ok) {
          setExpression(status.error?.message || "Initialization failed");
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
    const detectedExpr = detect({ landmarkerRef, videoRef, setExpression });
    onClick(detectedExpr);
  }

  useEffect(() => {
    if (!expression) return;
    setBadgePulse(true);
    const t = setTimeout(() => setBadgePulse(false), 650);
    return () => clearTimeout(t);
  }, [expression]);

  const KNOWN_MOODS = ["happy", "sad", "surprised", "neutral"];
  const moodKey = KNOWN_MOODS.includes(expression?.toLowerCase())
    ? expression.toLowerCase()
    : "detecting";
  const isLive = Boolean(initStatus?.ok);

  // Sync the root mood-current variable with detected emotion for global aura
  useEffect(() => {
    if (KNOWN_MOODS.includes(expression?.toLowerCase())) {
      document.documentElement.style.setProperty(
        "--mood-current",
        `var(--mood-${expression.toLowerCase()})`
      );
    }
  }, [expression]);

  const cardMarkup = (
    <div className="expression-card" data-mood={moodKey}>
      <div className="video-wrap">
        <video ref={videoRef} className="video-element" playsInline autoPlay muted />
      </div>

      <div className="status-row" aria-live="polite">
        <div className="status-indicator">
          <span className={`status-dot ${isLive ? "live" : ""}`} />
          <span className={`status-label ${badgePulse ? "pulse" : ""}`}>
            {expression}
          </span>
        </div>
        <span className="status-badge">MediaPipe v0.10</span>
      </div>

      <div className="controls">
        <button className="btn-primary" onClick={handleClick} disabled={!isLive}>
          Detect expression
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