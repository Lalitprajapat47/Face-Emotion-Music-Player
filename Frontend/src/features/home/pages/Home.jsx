import React, { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import Sensor from '../../Expressions/components/Sensor';
import { useFaceSensor } from '../../Expressions/hooks/useFaceSensor';
import Player from '../components/Player';
import AmbientBackground from '../components/AmbientBackground';
import MixPage from '../components/MixPage';
import { useSong } from '../hooks/useSong';
import '../style/home.scss';

// Moods that actually have songs behind them (matches the backend enum).
const MIX_MOODS = ['happy', 'sad', 'surprised'];
const KNOWN_MOODS = [...MIX_MOODS, 'neutral'];

// Smoothly morphs between the two screens where the browser supports it
// (the camera view glides from the big viewfinder into the corner window).
function withTransition(update) {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (typeof document.startViewTransition === 'function' && !reduceMotion) {
    document.startViewTransition(() => {
      flushSync(update);
    });
  } else {
    update();
  }
}

const Home = () => {
  const { handleGetSongList, playSong, stepSong } = useSong();

  const [view, setView] = useState('detect');   // 'detect' | 'mix'
  const [mix, setMix] = useState(null);         // { mood, snapshot, madeAt }
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState('');

  const sensor = useFaceSensor({
    headActive: view === 'mix',
    // turning your head to the right skips forward, to the left goes back
    onHeadTurn: (direction) => stepSong(direction === 'next' ? 1 : -1),
  });

  // What the camera sees right now (only used on the first screen)
  const liveMood = String(sensor.expression || '').toLowerCase().trim();
  const liveKnown = KNOWN_MOODS.includes(liveMood);

  // Accent colour for the whole app: the live mood while you're looking at
  // the camera, then locked to the mix's mood so the page doesn't change
  // colour every time you blink.
  const accentMood = view === 'mix' && mix ? mix.mood : (liveKnown ? liveMood : 'detecting');
  useEffect(() => {
    document.documentElement.style.setProperty('--mood-current', `var(--mood-${accentMood})`);
  }, [accentMood]);

  useEffect(() => {
    document.title = view === 'mix' && mix ? `${mix.mood.charAt(0).toUpperCase()}${mix.mood.slice(1)} Mix · Moodify` : 'Moodify';
  }, [view, mix]);

  const makeMix = async () => {
    if (busy || !sensor.isLive) return;
    setHint('');

    const { expression, snapshot } = sensor.capture();
    const mood = String(expression || '').toLowerCase().trim();

    if (!mood) {
      setHint("Couldn't see your face — make sure it's in the frame.");
      return;
    }
    if (!MIX_MOODS.includes(mood)) {
      setHint('You look neutral — try a smile, a frown or a surprised face.');
      return;
    }

    setBusy(true);
    const songs = await handleGetSongList({ mood });
    setBusy(false);

    if (!songs.length) {
      setHint(`There are no ${mood} songs in the library yet.`);
      return;
    }

    const next = { mood, snapshot, madeAt: Date.now() };
    if (view === 'mix') {
      setMix(next);
    } else {
      withTransition(() => {
        setMix(next);
        setView('mix');
      });
    }
    playSong(songs[0]);
  };

  const caption = sensor.error
    ? ''
    : liveKnown
      ? <>You look <span className="detect__mood">{liveMood}</span></>
      : 'Looking for your face…';

  return (
    <>
      {/* the flowing ribbons; tinted by the current mood, softer on the mix page */}
      <AmbientBackground mood={accentMood} dim={view === 'mix'} />

      <div className={`app app--${view}`}>
        <header className="topbar">
          <span className="topbar__logo">Moodify</span>
        </header>

        <main className="stage">
          {view === 'detect' && (
            <div className="detect__head">
              <h1 className="detect__title">How are you feeling?</h1>
              <p className="detect__sub">Look at the camera. We'll pick the music.</p>
            </div>
          )}

          {/* One camera element for the whole page — it never remounts, it
              just changes size and position between the two screens. */}
          <Sensor sensor={sensor} variant={view === 'mix' ? 'pip' : 'hero'} />

          {view === 'detect' && (
            <div className="detect__foot">
              <p className="detect__caption" key={liveKnown ? liveMood : 'searching'} aria-live="polite">
                {caption}
              </p>

              <button
                type="button"
                className="cta"
                onClick={makeMix}
                disabled={!sensor.isLive || busy}
              >
                {busy ? (<><span className="cta__spinner" aria-hidden="true" />Making your mix…</>) : 'Make my mix'}
              </button>

              {hint && <p className="detect__hint" role="status">{hint}</p>}
              <p className="detect__privacy">Your camera never leaves this device.</p>
            </div>
          )}

          {view === 'mix' && mix && (
            <MixPage mix={mix} onRedo={makeMix} busy={busy} hint={hint} sensor={sensor} />
          )}
        </main>

        <Player />
      </div>
    </>
  );
};

export default Home;