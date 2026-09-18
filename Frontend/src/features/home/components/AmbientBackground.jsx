import React from "react";
import "../style/ambient-bg.scss";

export default function AmbientBackground() {
  return (
    <div className="ambient-viewport" aria-hidden="true">
      {/* 1. Monochromatic deep topography (Image 1 wave curves) */}
      <div className="topo-cluster">
        <div className="mono-blob mono-1" />
        <div className="mono-blob mono-2" />
        <div className="mono-blob mono-3" />
      </div>

      {/* 2. Prismatic Light Streaks (Image 1 flare + Image 2 luminous visor band) */}
      <div className="prismatic-strip-container">
        <div className="optical-beam-core" />
        <div className="optical-flare-spread" />
        <div className="chromatic-ghost" />
      </div>

      {/* 3. Tactile Frosted Etched Glass + Grain Shroud (Image 2 texture) */}
      <div className="tactile-frost-shroud">
        <svg className="noise-surface">
          <filter id="etched-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.82"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#etched-grain)" opacity="0.38" />
        </svg>
      </div>

      <div className="ambient-vignette" />
    </div>
  );
}