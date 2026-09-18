import React, { useEffect, useRef } from "react";
import "../style/ambient-bg.scss";

export default function AmbientBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    let t = 0;

    const render = () => {
      t += 0.006;
      ctx.clearRect(0, 0, width, height);

      // Deep base studio gradient
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        50,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.8
      );
      bgGrad.addColorStop(0, "#0c0e14");
      bgGrad.addColorStop(0.5, "#06070a");
      bgGrad.addColorStop(1, "#030406");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Read dynamic CSS variable set by mood
      const computedStyle = getComputedStyle(document.documentElement);
      const moodColor = computedStyle.getPropertyValue("--mood-current").trim() || "#ff5e28";

      // 1. Morphing Low-Frequency Wave Curves (Monochrome depth)
      ctx.save();
      ctx.filter = "blur(70px)";
      for (let i = 0; i < 3; i++) {
        const offset = i * 1.8;
        const cx = width * (0.3 + 0.4 * Math.sin(t * 0.8 + offset));
        const cy = height * (0.4 + 0.25 * Math.cos(t * 0.7 + offset));
        const radius = Math.min(width, height) * (0.35 + 0.1 * Math.sin(t + offset));

        const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        radGrad.addColorStop(0, i === 0 ? "rgba(220, 225, 240, 0.18)" : "rgba(30, 35, 48, 0.4)");
        radGrad.addColorStop(0.8, "rgba(6, 7, 10, 0)");
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 2. Horizontal Anamorphic Prismatic Laser (Streak from Reference)
      ctx.save();
      ctx.globalCompositeOperation = "screen";

      const flareY = height * 0.52 + Math.sin(t * 1.2) * 25;
      const angle = -0.04 + Math.sin(t * 0.5) * 0.015;

      ctx.translate(width * 0.5, flareY);
      ctx.rotate(angle);

      // Outer diffused spectral envelope
      const wideGlow = ctx.createLinearGradient(-width, 0, width, 0);
      wideGlow.addColorStop(0, "rgba(0,0,0,0)");
      wideGlow.addColorStop(0.25, moodColor);
      wideGlow.addColorStop(0.5, "rgba(255, 255, 255, 0.95)");
      wideGlow.addColorStop(0.72, "#ff0077");
      wideGlow.addColorStop(1, "rgba(0,0,0,0)");

      ctx.filter = "blur(35px)";
      ctx.fillStyle = wideGlow;
      ctx.fillRect(-width * 0.8, -45, width * 1.6, 90);

      // Sharp Core Needle Beam
      const needleGlow = ctx.createLinearGradient(-width * 0.6, 0, width * 0.6, 0);
      needleGlow.addColorStop(0, "rgba(0,0,0,0)");
      needleGlow.addColorStop(0.35, moodColor);
      needleGlow.addColorStop(0.5, "#ffffff");
      needleGlow.addColorStop(0.65, "#ff3366");
      needleGlow.addColorStop(1, "rgba(0,0,0,0)");

      ctx.filter = "blur(6px)";
      ctx.fillStyle = needleGlow;
      ctx.fillRect(-width * 0.7, -4, width * 1.4, 8);

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="ambient-viewport" aria-hidden="true">
      <canvas ref={canvasRef} className="ambient-canvas" />
      <div className="tactile-grain-screen" />
      <div className="edge-vignette" />
    </div>
  );
}