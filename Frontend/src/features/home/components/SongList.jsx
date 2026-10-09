import React from 'react';
import { useSong } from '../hooks/useSong';
import '../style/song-list.scss';

const SongList = () => {
  const { songList, song, playSong, isPlaying } = useSong();

  // Panel stays collapsed (zero width) until there is something beyond the
  // single auto-played song to browse.
  const open = Boolean(songList && songList.length > 1);

  return (
    <aside
      className={`song-list ${open ? 'is-open' : ''}`}
      aria-label="More songs for this mood"
      aria-hidden={!open}
    >
      <div className="song-list__inner">
        <div className="song-list__header">
          <div>
            <p className="song-list__eyebrow">Recommended</p>
            <h2 className="song-list__title">More for this mood</h2>
          </div>
          <span className="song-list__count">{songList?.length || 0} tracks</span>
        </div>

        <ul className="song-list__rows">
          {(songList || []).map((item, index) => {
            const isActive = item._id ? item._id === song?._id : item.url === song?.url;
            const isNowPlaying = isActive && isPlaying;

            return (
              <li key={item._id || item.url}>
                <button
                  type="button"
                  className={`song-row ${isActive ? 'active' : ''}`}
                  onClick={() => playSong(item)}
                  style={{ '--n': index }}
                  tabIndex={open ? 0 : -1}
                >
                  <span className="song-row__art">
                    <span className="song-row__vinyl" aria-hidden="true" />
                    <img
                      className="song-row__poster"
                      src={item.posterUrl}
                      alt=""
                      loading="lazy"
                    />
                    {isActive && <span className="song-row__ring" aria-hidden="true" />}
                  </span>

                  <span className="song-row__meta">
                    <span className="song-row__name">{item.title}</span>
                    {item.mood && <span className="song-row__mood">{item.mood}</span>}
                  </span>

                  <span className="song-row__state" aria-hidden="true">
                    {isNowPlaying ? (
                      <span className="song-row__eq">
                        <span /><span /><span /><span />
                      </span>
                    ) : (
                      <span className="song-row__play">▶</span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
};

export default SongList;