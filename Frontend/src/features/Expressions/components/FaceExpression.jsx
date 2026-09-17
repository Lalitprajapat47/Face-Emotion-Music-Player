import React, { useRef, useEffect, useState } from "react";
import { init, detect } from "../utils/utils";
import "../style/face-expression.scss";

const MOOD_EMOJIS = {
  happy: "😄",
  sad: "😢",
  surprised: "😲",
  neutral: "😐"
};

const FaceExpression = ({ onMoodDetected }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);

  const [expression, setExpression] = useState("neutral");
  const [cameraActive, setCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const bufferRef = useRef([]);
  const lastEmittedMoodRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      setIsLoading(true);
      const res = await init({ landmarkerRef, videoRef, streamRef });
      if (isMounted) {
        setCameraActive(Boolean(res.ok));
        setIsLoading(false);
      }
    };

    setup();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let intervalId;

    if (cameraActive && !isLoading) {
      intervalId = setInterval(() => {
        const detected = detect({
          landmarkerRef,
          videoRef,
          setExpression
        });

        if (detected) {
          const normalized = detected.toLowerCase();

          // 3-frame quick stable check
          bufferRef.current.push(normalized);
          if (bufferRef.current.length > 3) bufferRef.current.shift();

          const isConsistent = bufferRef.current.every((m) => m === normalized);
          if (isConsistent && normalized !== lastEmittedMoodRef.current) {
            lastEmittedMoodRef.current = normalized;
            setExpression(normalized);
            if (onMoodDetected) {
              onMoodDetected(normalized);
            }
          }
        }
      }, 400);
    }

    return () => clearInterval(intervalId);
  }, [cameraActive, isLoading, onMoodDetected]);

  const toggleCamera = () => {
    if (cameraActive && streamRef.current) {
      streamRef.current.getTracks().forEach((t) => (t.enabled = !t.enabled));
      setCameraActive((prev) => !prev);
    } else {
      init({ landmarkerRef, videoRef, streamRef }).then((res) => {
        setCameraActive(Boolean(res.ok));
      });
    }
  };

  return (
    <div className="face-scanner-card">
      <div className="scanner-header">
        <div className="status-indicator">
          <span className={`dot ${cameraActive ? "live" : "offline"}`}></span>
          <span className="label">
            {isLoading ? "LOADING MODEL..." : cameraActive ? "AI SENSOR ACTIVE" : "CAMERA PAUSED"}
          </span>
        </div>
        <button className="cam-toggle-btn" onClick={toggleCamera}>
          {cameraActive ? "Pause" : "Resume"}
        </button>
      </div>

      <div className="viewport-container">
        <video ref={videoRef} autoPlay playsInline muted className="webcam-feed" />

        <div className="hud-overlay">
          <div className="corner top-left"></div>
          <div className="corner top-right"></div>
          <div className="corner bottom-left"></div>
          <div className="corner bottom-right"></div>
          {cameraActive && <div className="scanner-laser"></div>}
        </div>

        <div className="floating-mood-chip">
          <span className="mood-emoji">{MOOD_EMOJIS[expression.toLowerCase()] || "✨"}</span>
          <span className="mood-name">{expression.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};

export default FaceExpression;