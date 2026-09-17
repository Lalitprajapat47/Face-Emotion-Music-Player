import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  loadModels,
  detectFaceLandmarksAndExpressions,
  drawFaceLandmarksAndExpressions
} from "../utils/utils";
import "../style/face-expression.scss";

const MOOD_EMOJIS = {
  happy: "😄",
  sad: "😢",
  angry: "😡",
  surprised: "😲",
  fearful: "😨",
  disgusted: "🤢",
  neutral: "😐"
};

const FaceExpression = ({ onMoodDetected }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [currentMood, setCurrentMood] = useState("Scanning...");
  const [confidence, setConfidence] = useState(0);
  const [allConfidences, setAllConfidences] = useState([]);

  // Stability sliding window (debouncer taaki sudden skips na hon)
  const moodBufferRef = useRef([]);
  const BUFFER_SIZE = 5;
  const lastEmittedMoodRef = useRef(null);

  // 1. Existing utils se models load karna
  useEffect(() => {
    let isMounted = true;
    loadModels()
      .then(() => {
        if (isMounted) setModelsLoaded(true);
      })
      .catch((err) => console.error("Error loading models:", err));

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Camera stream handle karna
  const startVideo = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      setCameraActive(false);
    }
  }, []);

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (modelsLoaded) {
      startVideo();
    }
    return () => stopVideo();
  }, [modelsLoaded, startVideo]);

  // 3. Dominant & stable mood calculation
  const processStableMood = (detectedExpressions) => {
    if (!detectedExpressions) return;
    const sorted = Object.entries(detectedExpressions).sort((a, b) => b[1] - a[1]);
    if (!sorted.length) return;

    const [dominantMood, score] = sorted[0];

    setConfidence(Math.round(score * 100));
    setAllConfidences(sorted.slice(0, 3));

    moodBufferRef.current.push(dominantMood);
    if (moodBufferRef.current.length > BUFFER_SIZE) {
      moodBufferRef.current.shift();
    }

    const isStable = moodBufferRef.current.every((m) => m === dominantMood);
    if (isStable && dominantMood !== lastEmittedMoodRef.current && score > 0.55) {
      lastEmittedMoodRef.current = dominantMood;
      setCurrentMood(dominantMood);
      if (onMoodDetected) {
        onMoodDetected(dominantMood);
      }
    }
  };

  // 4. Detection loop (300ms light throttling)
  useEffect(() => {
    let intervalId;
    if (cameraActive && modelsLoaded) {
      intervalId = setInterval(async () => {
        if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

        try {
          const detections = await detectFaceLandmarksAndExpressions(videoRef.current);

          if (detections && canvasRef.current) {
            drawFaceLandmarksAndExpressions(
              videoRef.current,
              canvasRef.current,
              detections
            );

            if (detections.expressions) {
              processStableMood(detections.expressions);
            }
          }
        } catch (error) {
          // Frame drop safe catch
        }
      }, 300);
    }

    return () => clearInterval(intervalId);
  }, [cameraActive, modelsLoaded]);

  return (
    <div className="face-scanner-card">
      <div className="scanner-header">
        <div className="status-indicator">
          <span className={`dot ${cameraActive ? "live" : "offline"}`}></span>
          <span className="label">
            {cameraActive ? "AI SENSOR ACTIVE" : "CAMERA OFF"}
          </span>
        </div>
        <button
          className="cam-toggle-btn"
          onClick={() => (cameraActive ? stopVideo() : startVideo())}
        >
          {cameraActive ? "Pause" : "Start"}
        </button>
      </div>

      <div className="viewport-container">
        <video ref={videoRef} autoPlay muted playsInline className="webcam-feed" />
        <canvas ref={canvasRef} className="landmarks-canvas" />

        {/* HUD Scanner Frame */}
        <div className="hud-overlay">
          <div className="corner top-left"></div>
          <div className="corner top-right"></div>
          <div className="corner bottom-left"></div>
          <div className="corner bottom-right"></div>
          <div className="scanner-laser"></div>
        </div>

        {/* Floating Detected Mood Badge */}
        <div className="floating-mood-chip">
          <span className="mood-emoji">{MOOD_EMOJIS[currentMood] || "✨"}</span>
          <span className="mood-name">{currentMood.toUpperCase()}</span>
          {confidence > 0 && <span className="mood-pct">{confidence}%</span>}
        </div>
      </div>

      {/* Real-time Confidence Meters */}
      <div className="confidence-meters">
        {allConfidences.map(([mood, val]) => (
          <div key={mood} className="meter-row">
            <span className="meter-name">{mood}</span>
            <div className="meter-track">
              <div
                className="meter-fill"
                style={{ width: `${Math.round(val * 100)}%` }}
              ></div>
            </div>
            <span className="meter-val">{Math.round(val * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FaceExpression;