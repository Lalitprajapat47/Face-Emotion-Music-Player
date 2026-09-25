import React from 'react';
import { useSong } from '../hooks/useSong';
import '../style/song-list.scss';

const SongList = () => {
  const { songList, song, playSong } = useSong();

  // Nothing (or only the one already-playing song) to browse — stay hidden
  // instead of showing an empty/pointless section.
  if (!songList || songList.length <= 1) return null;

  return (
    <section className="song-list" aria-label="More songs for this mood">
      <div className="song-list__header">
        <div>
          <p className="song-list__eyebrow">Recommended</p>
          <h2 className="song-list__title">More for this mood</h2>
        </div>
        <span className="song-list__count">{songList.length} tracks</span>
      </div>
      <div className="song-list__row">
        {songList.map((item, index) => {
          const isActive = item._id ? item._id === song?._id : item.url === song?.url;
          return (
            <button
              key={item._id || item.url}
              className={`song-list__card ${isActive ? 'active' : ''}`}
              onClick={() => playSong(item)}
              type="button"
              style={{ '--i': index % 2 === 0 ? -1 : 1 }}
            >
              <span className="song-list__vinyl-peek" aria-hidden="true" />
              <div className="song-list__art">
                <img
                  className="song-list__poster"
                  src={item.posterUrl}
                  alt=""
                  loading="lazy"
                />
                {isActive ? (
                  <span className="song-list__eq" aria-hidden="true">
                    <span /><span /><span /><span />
                  </span>
                ) : (
                  <span className="song-list__play-icon" aria-hidden="true">▶</span>
                )}
                {isActive && <span className="song-list__glow-ring" aria-hidden="true" />}
              </div>
              <div className="song-list__meta">
                <span className="song-list__name">{item.title}</span>
                {item.mood && <span className="song-list__mood">{item.mood}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default SongList;