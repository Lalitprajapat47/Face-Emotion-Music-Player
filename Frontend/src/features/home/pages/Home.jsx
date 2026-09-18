import React from 'react';
import FaceExpression from '../../Expressions/components/FaceExpression';
import Player from '../components/Player';
import { useSong } from '../hooks/useSong';
import '../style/home.scss';

const Home = () => {
  const { handleGetSong } = useSong();

  return (
    <div className="site-container home-hero">
      {/* Studio Header inspired by Reference Micro-tags */}
      <header className="studio-nav">
        <div className="brand-logo">
          <span className="symbol">∿</span>
          Moodify <span className="reg-mark">®</span>
        </div>
        <div className="tech-stamp">NEUROMORPHIC AUDIO ENGINE [2026]</div>
      </header>

      {/* Main Hero Section */}
      <section className="hero-section neon-hero">
        <div className="hero-left">
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            Live biometric detection
          </p>
          <h1 className="hero-title">
            Find music that <span className="faded">matches your face.</span>
          </h1>
          <p className="lead">
            Moodify reads micro-expressions through your camera and queues an auditory
            profile to match — pure resonance, zero searching.
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

      {/* Embedded Player */}
      <Player />
    </div>
  );
};

export default Home;