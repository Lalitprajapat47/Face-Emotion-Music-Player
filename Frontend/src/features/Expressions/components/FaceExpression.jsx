import React, { useRef, useEffect, useState, useCallback } from "react";
import * as faceapi from "face-api.js";
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

  // Stability counters taaki har millisecond pe mood na badle
  const moodBufferRef = useRef([]);
  const BUFFER_SIZE = 6; // ~1.5 - 2 seconds continuous reading
  const lastEmittedMoodRef = useRef(null);

  // 1. Load Face-API Models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models"; // ensure models public/models me hon
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Face-api models load nahi ho paye:", err);
      }
    };
    loadModels();
  }, []);

  // 2. Start Video Stream
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
      console.error("Camera access error:", err);
      setCameraActive(false);
    }
  }, []);

  // Stop Video Stream
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

  // 3. Stable Emotion Calculation
  const processStableMood = (detectedExpressions) => {
    // Sort highest emotion
    const sorted = Object.entries(detectedExpressions).sort((a, b) => b[1] - a[1]);
    const [dominantMood, score] = sorted[0];

    // Set preview meter
    setConfidence(Math.round(score * 100));
    setAllConfidences(sorted.slice(0, 3)); // Top 3 moods

    // Add to sliding window
    moodBufferRef.current.push(dominantMood);
    if (moodBufferRef.current.length > BUFFER_SIZE) {
      moodBufferRef.current.shift();
    }

    // Check consistency
    const isStable = moodBufferRef.current.every((m) => m === dominantMood);
    if (isStable && dominantMood !== lastEmittedMoodRef.current && score > 0.6) {
      lastEmittedMoodRef.current = dominantMood;
      setCurrentMood(dominantMood);
      if (onMoodDetected) {
        onMoodDetected(dominantMood);
      }
    }
  };

  // 4. Detection Interval Loop
  useEffect(() => {
    let intervalId;
    if (cameraActive && modelsLoaded) {
      intervalId = setInterval(async () => {
        if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

        const detections = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();

        if (detections && canvasRef.current) {
          const displaySize = {
            width: videoRef.current.videoWidth || 320,
            height: videoRef.current.videoHeight || 240
          };
          faceapi.matchDimensions(canvasRef.current, displaySize);

          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          const ctx = canvasRef.current.getContext("2d");
          ctx.clearRect(0, 0, displaySize.width, displaySize.height);

          // Subtle custom dot landmark drawing
          faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections, {
            drawLines: false,
            color: "#6366f1",
            lineWidth: 1
          });

          processStableMood(detections.expressions);
        }
      }, 300); // 300ms throttle keeps CPU light
    }

    return () => clearInterval(intervalId);
  }, [cameraActive, modelsLoaded]);

  return (
    <div className="face-scanner-card">
      <div className="scanner-header">
        <div className="status-indicator">
          <span className={`dot ${cameraActive ? "live" : "offline"}`}></span>
          <span className="label">{cameraActive ? "AI SENSOR ACTIVE" : "CAMERA OFF"}</span>
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

        {/* HUD Targeting Overlay */}
        <div className="hud-overlay">
          <div className="corner top-left"></div>
          <div className="corner top-right"></div>
          <div className="corner bottom-left"></div>
          <div className="corner bottom-right"></div>
          <div className="scanner-laser"></div>
        </div>

        {/* Current Mood Chip Tag */}
        <div className="floating-mood-chip">
          <span className="mood-emoji">{MOOD_EMOJIS[currentMood] || "✨"}</span>
          <span className="mood-name">{currentMood.toUpperCase()}</span>
          {confidence > 0 && <span className="mood-pct">{confidence}%</span>}
        </div>
      </div>

      {/* Real-time confidence bars */}
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