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

      <div className="site-container studio">
        <header className="studio__brand">
          <span className="studio__brand-mark" />
          Moodify
        </header>

        <section className="studio__stage">
          <p className="studio__tagline">
            Find music that matches your face
          </p>

          <div className="signal-line signal-line--in">
            <span className="signal-line__pulse" />
          </div>

          <FaceExpression compact onClick={handleExpressionDetected} />

          <div className="signal-line signal-line--out">
            <span className="signal-line__pulse" />
          </div>
        </section>

        <SongList />
        <Player />
      </div>
    </>
  );
};

export default Home;