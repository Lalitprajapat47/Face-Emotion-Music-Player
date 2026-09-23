import React, { useEffect, useRef } from "react";
import "../style/ambient-bg.scss";

// Canvas 2D's fillStyle/strokeStyle cannot resolve CSS var() references —
// it needs an actual color string. So instead of reading --mood-current via
// getComputedStyle (which may return the raw "var(--mood-happy)" token
// rather than a resolved color, depending on the browser), we keep a real
// JS color map here and read the mood key straight off the DOM attribute
// that FaceExpression.jsx already sets.
const MOOD_HEX = {
  happy: "#ff601c",
  sad: "#3b82f6",
  surprised: "#d946ef",
  neutral: "#94a3b8",
  detecting: "#64748b",
};

export default function AmbientBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let paused = document.hidden;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    // Pause the animation while the tab isn't visible — a full-viewport
    // blurred canvas running forever in a background tab is pure wasted
    // battery/CPU.
    const onVisibility = () => {
      paused = document.hidden;
      if (!paused) render();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let t = 0;

    const render = () => {
      if (paused) return;
      t += reduceMotion ? 0.002 : 0.012;
      ctx.clearRect(0, 0, w, h);

      // Deep Studio Pitch Black Base
      ctx.fillStyle = "#040507";
      ctx.fillRect(0, 0, w, h);

      const moodKey =
        document
          .querySelector(".expression-card")
          ?.getAttribute("data-mood") || "detecting";
      const moodColor = MOOD_HEX[moodKey] || MOOD_HEX.detecting;

      ctx.save();
      ctx.globalCompositeOperation = "screen";

      // Multi-layer Apple/Google Siri-style morphing luminous ribbons —
      // kept subtle: no central round flare blob (that was the "gola jesa
      // glow" the user asked to remove), and lower blur/alpha so it reads
      // as gentle ambient motion instead of a bright streak.
      const ribbons = [
        { amp: 45, freq: 0.0018, speed: 1.4, color: moodColor, blur: 40, alpha: 0.48 },
        { amp: 65, freq: 0.0022, speed: -1.1, color: "#ec4899", blur: 34, alpha: 0.3 },
        { amp: 35, freq: 0.003, speed: 1.8, color: "#38bdf8", blur: 28, alpha: 0.32 },
        { amp: 20, freq: 0.0015, speed: -0.8, color: "#ffffff", blur: 11, alpha: 0.45 }
      ];

      const centerY = h * 0.52;

      ribbons.forEach((ribbon, index) => {
        ctx.save();
        ctx.filter = `blur(${ribbon.blur}px)`;
        ctx.globalAlpha = ribbon.alpha;
        ctx.beginPath();

        const step = 8;
        let started = false;

        for (let x = -100; x <= w + 100; x += step) {
          // Dynamic harmonic sine & cosine synthesis
          const wave1 = Math.sin(x * ribbon.freq + t * ribbon.speed) * ribbon.amp;
          const wave2 = Math.cos(x * (ribbon.freq * 1.6) - t * (ribbon.speed * 0.8)) * (ribbon.amp * 0.6);
          const dynamicCenter = centerY + Math.sin(t * 0.6 + index) * 25;
          const y = dynamicCenter + wave1 + wave2;

          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }

        // Variable line thickness & gradient shading
        ctx.strokeStyle = ribbon.color;
        ctx.lineWidth = index === 3 ? 14 : 48;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.restore();
      });

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    if (!paused) render();

    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="ambient-viewport" aria-hidden="true">
      <canvas ref={canvasRef} className="ambient-canvas" />
      <div className="tactile-frost-texture" />
      <div className="vignette-radial" />
    </div>
  );
}