import React, { useEffect, useRef } from "react";
import "../style/ambient-bg.scss";

// Canvas 2D's strokeStyle can't resolve CSS var() references, so the mood
// colours are kept here as real hex values.
const MOOD_HEX = {
  happy: "#ff601c",
  sad: "#3b82f6",
  surprised: "#d946ef",
  neutral: "#94a3b8",
  detecting: "#64748b",
};

// The ribbons are heavily blurred anyway, so the canvas is rendered at half
// size and scaled up by CSS. Same look, but only a quarter of the pixels to
// blur every frame — which keeps the face-detection loop smooth.
const RENDER_SCALE = 0.5;

/**
 * The flowing, Siri-style ribbon background.
 *  - mood: key of the colour of the main ribbon (happy / sad / surprised …)
 *  - dim:  softens the whole layer (used on the mix page so the tracklist
 *          stays easy to read)
 */
export default function AmbientBackground({ mood = "detecting", dim = false }) {
  const canvasRef = useRef(null);

  // The animation loop reads the latest mood from a ref, so changing the
  // mood never restarts the loop.
  const moodRef = useRef(mood);
  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    let animId = 0;
    let paused = document.hidden;
    let w = 0;
    let h = 0;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.max(1, Math.round(w * RENDER_SCALE));
      canvas.height = Math.max(1, Math.round(h * RENDER_SCALE));
    };
    resize();
    window.addEventListener("resize", resize);

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let t = 0;

    const render = () => {
      if (paused) return;
      t += reduceMotion ? 0.002 : 0.012;

      // draw in normal CSS-pixel units; the transform maps them onto the
      // smaller bitmap
      ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Deep Studio Pitch Black Base
      ctx.fillStyle = "#040507";
      ctx.fillRect(0, 0, w, h);

      const moodColor = MOOD_HEX[moodRef.current] || MOOD_HEX.detecting;

      ctx.save();
      ctx.globalCompositeOperation = "screen";

      const ribbons = [
        { amp: 45, freq: 0.0018, speed: 1.4, color: moodColor, blur: 40, alpha: 0.48 },
        { amp: 65, freq: 0.0022, speed: -1.1, color: "#ec4899", blur: 34, alpha: 0.3 },
        { amp: 35, freq: 0.003, speed: 1.8, color: "#38bdf8", blur: 28, alpha: 0.32 },
        { amp: 20, freq: 0.0015, speed: -0.8, color: "#ffffff", blur: 11, alpha: 0.45 },
      ];

      const centerY = h * 0.52;

      ribbons.forEach((ribbon, index) => {
        ctx.save();
        // filter radii are in bitmap pixels, so scale them with the canvas
        ctx.filter = `blur(${ribbon.blur * RENDER_SCALE}px)`;
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

    // Pause while the tab is hidden — a full-screen blurred canvas running in
    // a background tab is wasted battery. Cancelling before restarting makes
    // sure quick hide/show flips can never leave two loops running.
    const onVisibility = () => {
      paused = document.hidden;
      cancelAnimationFrame(animId);
      if (!paused) render();
    };
    document.addEventListener("visibilitychange", onVisibility);

    if (!paused) render();

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className={`ambient-viewport ${dim ? "is-dim" : ""}`} aria-hidden="true">
      <canvas ref={canvasRef} className="ambient-canvas" />
      <div className="tactile-frost-texture" />
      <div className="vignette-radial" />
    </div>
  );
}