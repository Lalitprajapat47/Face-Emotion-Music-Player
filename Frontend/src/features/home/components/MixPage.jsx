import React, { useMemo } from 'react';
import { useSong } from '../hooks/useSong';
import '../style/mix.scss';

const cap = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 5.14v14l11-7-11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

function daypart(hour) {
  if (hour < 5) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

/**
 * "Your mix" page, modelled on a streaming-app playlist page: big cover
 * (your own face, tinted in the mood colour), huge title, play button and a
 * numbered tracklist.
 */
export default function MixPage({ mix, onRedo, busy, hint, sensor }) {
  const { songList, isPlaying, activeIndex, playSong, togglePlayback } = useSong();

  const title = `${cap(mix.mood)} Mix`;
  const count = songList.length;

  // Spotify-"Daylist"-style subtitle: when this mix was made
  const when = useMemo(() => {
    const d = new Date(mix.madeAt);
    const day = d.toLocaleDateString('en-IN', { weekday: 'long' });
    return `${day} ${daypart(d.getHours())}`;
  }, [mix.madeAt]);

  const onPlayClick = () => {
    if (activeIndex === -1) playSong(songList[0]);
    else togglePlayback();
  };

  const onRowClick = (item, index) => {
    if (index === activeIndex) togglePlayback();
    else playSong(item);
  };

  const mixPlaying = activeIndex !== -1 && isPlaying;

  return (
    <section className="mix" data-mood={mix.mood}>
      <div className="mix__inner">
        <div className="mix__hero">
          <div className={`cover ${mix.snapshot ? '' : 'cover--empty'}`} aria-hidden="true">
            {mix.snapshot && (
              <>
                <img className="cover__photo" src={mix.snapshot} alt="" />
                <span className="cover__tint" />
              </>
            )}
            <span className="cover__scrim" />
            <span className="cover__brand">MOODIFY</span>
            <span className="cover__title">{cap(mix.mood)}<br />Mix</span>
          </div>

          <div className="mix__info">
            <p className="mix__kind">Mood mix</p>
            <h1 className="mix__title">{title}</h1>
            <p className="mix__meta">
              {mix.snapshot && <img className="mix__avatar" src={mix.snapshot} alt="" />}
              <strong>Made from your face</strong>
              <span className="mix__sep" aria-hidden="true">·</span>
              <span>{count} {count === 1 ? 'song' : 'songs'}</span>
              <span className="mix__sep" aria-hidden="true">·</span>
              <span>{when}</span>
            </p>
          </div>
        </div>

        <div className="mix__actions">
          <button
            type="button"
            className="playbtn"
            onClick={onPlayClick}
            aria-label={mixPlaying ? 'Pause' : 'Play'}
          >
            {mixPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>

          <button type="button" className="ghost" onClick={onRedo} disabled={busy}>
            {busy ? 'Reading your face…' : 'Detect again'}
          </button>

          <button
            type="button"
            className={`switch ${sensor.headEnabled ? 'is-on' : ''}`}
            onClick={() => sensor.setHeadEnabled((v) => !v)}
            aria-pressed={sensor.headEnabled}
          >
            <span className="switch__track"><span className="switch__thumb" /></span>
            Head control
          </button>

          {sensor.headEnabled && !hint && (
            <span className="mix__tip">Turn your head left or right to skip</span>
          )}
          {hint && <span className="mix__hint" role="status">{hint}</span>}
        </div>

        <div className="tracks">
          <div className="tracks__head" aria-hidden="true">
            <span>#</span>
            <span />
            <span>Title</span>
          </div>

          <ul className="tracks__list">
            {songList.map((item, index) => {
              const active = index === activeIndex;
              const playing = active && isPlaying;

              return (
                <li key={item._id || item.url}>
                  <button
                    type="button"
                    className={`track ${active ? 'is-active' : ''}`}
                    style={{ '--n': index }}
                    onClick={() => onRowClick(item, index)}
                  >
                    <span className="track__idx">
                      {playing ? (
                        <span className="track__eq" aria-hidden="true">
                          <span /><span /><span />
                        </span>
                      ) : (
                        <span className="track__num">{index + 1}</span>
                      )}
                      <span className="track__play" aria-hidden="true">
                        {playing ? <PauseIcon /> : <PlayIcon />}
                      </span>
                    </span>

                    <img className="track__cover" src={item.posterUrl} alt="" loading="lazy" />

                    <span className="track__meta">
                      <span className="track__title">{item.title}</span>
                      {item.mood && <span className="track__sub">{item.mood}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}