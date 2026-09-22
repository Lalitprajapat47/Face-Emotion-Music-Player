import React from 'react';
import FaceExpression from '../../Expressions/components/FaceExpression';
import Player from '../components/Player';
import { useSong } from '../hooks/useSong';
import '../style/home.scss';

const Home = () => {
  const { handleGetSong } = useSong();

  return (
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
          <FaceExpression
            compact
            onClick={(expression) => {
              handleGetSong({ mood: expression });
            }}
          />
        </div>
      </section>

      <Player />
    </div>
  );
};

export default Home;