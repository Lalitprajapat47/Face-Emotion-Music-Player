import React, { useRef } from "react";
import FaceExpression from "../../Expressions/components/FaceExpression";
import Player from "../components/Player";
import { useSong } from "../hooks/useSong";
import { useAuth } from "../../auth/hooks/useAuth";
import "../style/home.scss";

const Home = () => {
  const { song, loading, currentMood, fetchSongByMood } = useSong();
  const { user, logout } = useAuth();
  const lastDetectedMoodRef = useRef("");

  // Face detect hote hi backend se song fetch hoga
  const handleMoodDetected = (detectedMood) => {
    if (!detectedMood) return;
    const clean = detectedMood.toLowerCase();

    if (clean !== lastDetectedMoodRef.current) {
      lastDetectedMoodRef.current = clean;
      if (fetchSongByMood) {
        fetchSongByMood(clean);
      }
    }
  };

  const moodList = ["happy", "sad", "surprised", "neutral"];

  return (
    <div className="moodify-dashboard">
      <div className="grid-background-overlay">
        <div className="grid-col"></div>
        <div className="grid-col"></div>
        <div className="grid-col"></div>
        <div className="grid-col"></div>
      </div>

      <header className="dashboard-nav">
        <div className="brand-logo">
          <div className="brand-icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <h2>Moodify<span>.ai</span></h2>
        </div>

        <div className="nav-actions">
          <div className="user-profile">
            <span className="username">{user?.username || "Account"}</span>
            <button className="logout-btn" onClick={logout} title="Sign Out">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <section className="hero-syncly-section">
        <div className="ai-pill-tag">
          <span className="sparkle">✦</span>
          <span>Real-time Neural Audio Engine</span>
        </div>

        <h1 className="hero-main-heading">Syncly</h1>

        <p className="hero-sub-description">
          Detect facial landmarks, categorize emotional drivers, and curate high-fidelity sonic flows automatically.
        </p>

        <div className="mood-filter-tabs">
          {moodList.map((m) => (
            <button
              key={m}
              className={`mood-tab ${currentMood === m ? "active" : ""}`}
              onClick={() => {
                lastDetectedMoodRef.current = m;
                fetchSongByMood(m);
              }}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-core-wrapper">
        <div className="floating-pill pill-left">
          <span className="pill-icon"></span>
          <span>Mood-Matched Queue</span>
        </div>

        <div className="floating-pill pill-right">
          <span className="pill-icon"></span>
          <span>Camera Vision Active</span>
        </div>

        <div className="master-console-card">
          <div className="tracks-pane">
            <div className="pane-top-bar">
              <div className="pane-title">
                <h3>Current Sonic Match</h3>
              </div>
              <div className="detected-pill">
                Detected Mood: <strong>{currentMood}</strong>
              </div>
            </div>

            <div className="tracks-table">
              {loading ? (
                <div className="empty-tracks-placeholder">
                  Syncing track for {currentMood}...
                </div>
              ) : song ? (
                <div className="track-row is-active">
                  <span className="track-num">▶</span>
                  <div className="track-meta">
                    <span className="track-title">{song.title || "Untitled Track"}</span>
                    <span className="track-artist">Mood-based Curation</span>
                  </div>
                  <span className="track-mood">{song.mood || currentMood}</span>
                </div>
              ) : (
                <div className="empty-tracks-placeholder">
                  No track found in database for "{currentMood}".
                </div>
              )}
            </div>
          </div>

          <aside className="scanner-pane">
            <FaceExpression onMoodDetected={handleMoodDetected} />
          </aside>
        </div>
      </section>

      <Player />
    </div>
  );
};

export default Home;