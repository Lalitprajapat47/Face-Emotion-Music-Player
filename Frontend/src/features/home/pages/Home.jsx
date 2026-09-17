import React, { useEffect, useState } from "react";
import FaceExpression from "../../Expressions/components/FaceExpression";
import Player from "../components/Player";
import { useSong } from "../hooks/useSong";
import { useAuth } from "../../auth/hooks/useAuth";
import "../style/home.scss";

const Home = () => {
  const { songs, currentSong, playSong, fetchSongs, mood: activeMood } = useSong();
  const { user, logout } = useAuth();
  const [selectedMood, setSelectedMood] = useState("all");

  // Initial load
  useEffect(() => {
    if (fetchSongs) {
      fetchSongs("all");
    }
  }, []);

  // Face detect hone par gaane fetch aur auto-change
  const handleMoodDetected = (detectedMood) => {
    if (!detectedMood) return;
    const cleanMood = detectedMood.toLowerCase();
    
    if (cleanMood !== selectedMood) {
      setSelectedMood(cleanMood);
      if (fetchSongs) {
        fetchSongs(cleanMood);
      }
    }
  };

  // Manual chip click
  const handleMoodTab = (mood) => {
    const cleanMood = mood.toLowerCase();
    setSelectedMood(cleanMood);
    if (fetchSongs) {
      fetchSongs(cleanMood);
    }
  };

  const availableMoods = ["all", "happy", "sad", "surprised", "neutral"];

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
            <span className="username">{user?.username || "User"}</span>
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
          {availableMoods.map((m) => (
            <button
              key={m}
              className={`mood-tab ${selectedMood === m ? "active" : ""}`}
              onClick={() => handleMoodTab(m)}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-core-wrapper">
        <div className="floating-pill pill-left">
          <span className="pill-icon"></span>
          <span>Adaptive Playlist</span>
        </div>

        <div className="floating-pill pill-right">
          <span className="pill-icon"></span>
          <span>Vision AI Linked</span>
        </div>

        <div className="master-console-card">
          <div className="tracks-pane">
            <div className="pane-top-bar">
              <div className="pane-title">
                <h3>Vibe Queue</h3>
                <span className="count-tag">{songs ? songs.length : 0}</span>
              </div>
              <div className="detected-pill">
                Active: {selectedMood || activeMood || "neutral"}
              </div>
            </div>

            <div className="tracks-table">
              {songs && songs.length > 0 ? (
                songs.map((song, index) => {
                  const isCurrent = currentSong?._id === song._id;
                  return (
                    <div
                      key={song._id || index}
                      className={`track-row ${isCurrent ? "is-active" : ""}`}
                      onClick={() => playSong && playSong(song)}
                    >
                      <span className="track-num">{index + 1}</span>
                      <div className="track-meta">
                        <span className="track-title">{song.title || song.name || "Untitled Track"}</span>
                        <span className="track-artist">{song.artist || "Unknown Artist"}</span>
                      </div>
                      <span className="track-mood">{song.mood || "neutral"}</span>
                      <button className="track-play-trigger">
                        {isCurrent ? (
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="4" width="4" height="16"></rect>
                            <rect x="14" y="4" width="4" height="16"></rect>
                          </svg>
                        ) : (
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                        )}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="empty-tracks-placeholder">
                  No audio tracks match "{selectedMood}". Try another mood tab.
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