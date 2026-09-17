import React, { useRef, useEffect, useState, useCallback } from "react";
import { init, detect } from "../utils/utils";
import "../style/face-expression.scss";

const FaceExpression = ({ onMoodDetected }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);

  const [expression, setExpression] = useState("Neutral");
  const [cameraActive, setCameraActive] = useState(false);
  
  const lastEmittedRef = useRef("");
  const isInitializingRef = useRef(false);

  // 1. Initialize camera and model once
  useEffect(() => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    let isMounted = true;
    init({ landmarkerRef, videoRef, streamRef }).then((res) => {
      if (isMounted && res.ok) {
        setCameraActive(true);
      }
    });

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 2. Ultra-lightweight 1-second interval (Zero CPU Lag)
  const handleMoodDetectedMemo = useCallback((mood) => {
    if (onMoodDetected) {
      onMoodDetected(mood);
    }
  }, [onMoodDetected]);

  useEffect(() => {
    if (!cameraActive) return;

    const intervalId = setInterval(() => {
      try {
        const detected = detect({
          landmarkerRef,
          videoRef,
          setExpression,
        });

        if (detected) {
          const clean = detected.toLowerCase();
          if (clean !== lastEmittedRef.current) {
            lastEmittedRef.current = clean;
            handleMoodDetectedMemo(clean);
          }
        }
      } catch (e) {
        // Safe catch for frame skips
      }
    }, 1000); // Har 1 second me check karega, lag bilkul khatam

    return () => clearInterval(intervalId);
  }, [cameraActive, handleMoodDetectedMemo]);

  return (
    <div className="face-scanner-card">
      <div className="scanner-header">
        <div className="status-indicator">
          <span className={`dot ${cameraActive ? "live" : "offline"}`}></span>
          <span className="label">
            {cameraActive ? "AI SENSOR ACTIVE" : "INITIALIZING..."}
          </span>
        </div>
      </div>

      <div className="viewport-container">
        <video ref={videoRef} autoPlay playsInline muted className="webcam-feed" />

        <div className="hud-overlay">
          <div className="corner top-left"></div>
          <div className="corner top-right"></div>
          <div className="corner bottom-left"></div>
          <div className="corner bottom-right"></div>
        </div>

        <div className="floating-mood-chip">
          <span className="mood-name">{expression.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};

export default FaceExpression;