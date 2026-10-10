import React from 'react';
import FaceExpression from '../../Expressions/components/FaceExpression';
import Player from '../components/Player';
import RecordOrbit from '../components/RecordOrbit';
import AmbientBackground from '../components/AmbientBackground';
import { useSong } from '../hooks/useSong';
import '../style/home.scss';

const Home = () => {
  const { handleGetSong, handleGetSongList, songList, stepSong } = useSong();

  // The halo of records only opens when there is more than the single
  // auto-played song to browse.
  const hasResults = Boolean(songList && songList.length > 1);

  const handleExpressionDetected = (expression) => {
    // Default behaviour, unchanged: fetch + auto-play one matching song.
    handleGetSong({ mood: expression });
    // Additional: also fetch the full list so the user can browse others.
    handleGetSongList({ mood: expression });
  };

  // Turning your head to the right flips forward through the records,
  // to the left flips back.
  const handleHeadTurn = (direction) => {
    stepSong(direction === 'next' ? 1 : -1);
  };

  return (
    <>
      <AmbientBackground />

      <div className={`site-container studio ${hasResults ? 'studio--results' : ''}`}>
        <header className="studio__brand">
          <span className="studio__brand-mark" aria-hidden="true">
            <span /><span /><span />
          </span>
          Moodify
        </header>

        <section className="studio__stage">
          <p className="studio__tagline">
            Find music that matches your face
          </p>

          <div className="signal-line signal-line--in">
            <span className="signal-line__pulse" />
          </div>

          <RecordOrbit />

          <FaceExpression
            compact
            onClick={handleExpressionDetected}
            onHeadTurn={handleHeadTurn}
            headHint={hasResults}
          />

          <div className="signal-line signal-line--out">
            <span className="signal-line__pulse" />
          </div>
        </section>

        <Player />
      </div>
    </>
  );
};

export default Home;