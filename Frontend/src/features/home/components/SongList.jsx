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
        {songList.map((item) => {
          const isActive = item._id ? item._id === song?._id : item.url === song?.url;
          return (
            <button
              key={item._id || item.url}
              className={`song-list__card ${isActive ? 'active' : ''}`}
              onClick={() => playSong(item)}
              type="button"
            >
              <div className="song-list__art">
                <img
                  className="song-list__poster"
                  src={item.posterUrl}
                  alt=""
                  loading="lazy"
                />
                <span className="song-list__play-icon" aria-hidden="true">
                  {isActive ? '❚❚' : '▶'}
                </span>
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