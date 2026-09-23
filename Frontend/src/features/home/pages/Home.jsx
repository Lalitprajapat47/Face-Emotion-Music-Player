import React from 'react';
import FaceExpression from '../../Expressions/components/FaceExpression';
import Player from '../components/Player';
import SongList from '../components/SongList';
import AmbientBackground from '../components/AmbientBackground';
import { useSong } from '../hooks/useSong';
import '../style/home.scss';

const Home = () => {
  const { handleGetSong, handleGetSongList } = useSong();

  const handleExpressionDetected = (expression) => {
    // Default behaviour, unchanged: fetch + auto-play one matching song.
    handleGetSong({ mood: expression });
    // Additional: also fetch the full list so the user can browse others.
    handleGetSongList({ mood: expression });
  };

  return (
    <>
      <AmbientBackground />

      <div className="site-container home-hero">
        <section className="hero-section neon-hero">
          <div className="hero-left">
            <p className="eyebrow">
              <span className="eyebrow-dot" />
              Live camera detection
            </p>
            <h1 className="hero-title">Find music that matches your face</h1>
            <p className="lead">
              Moodify reads your expression through your camera and queues a track
              to match — no typing, no searching.
            </p>
          </div>

          <div className="hero-right">
            <FaceExpression compact onClick={handleExpressionDetected} />
          </div>
        </section>

        <Player />
        <SongList />
      </div>
    </>
  );
};

export default Home;