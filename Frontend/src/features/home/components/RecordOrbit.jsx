import React, { useEffect, useRef, useState } from 'react';
import { useSong } from '../hooks/useSong';
import '../style/record-orbit.scss';

const STEP = 24;                          // degrees between neighbouring records
const VISIBLE = 3;                        // records shown on each side of the focused one
const OPACITY = [1, 0.92, 0.62, 0.3];     // by distance from the focused record
const SCALE = [1.18, 0.86, 0.7, 0.58];

const sameSong = (a, b) => Boolean(a && b) && (a._id ? a._id === b._id : a.url === b.url);

export default function RecordOrbit() {
  const { songList, song, playSong, stepSong, activeIndex, isPlaying } = useSong();

  // The halo only opens when there is more than the single auto-played song.
  const open = Boolean(songList && songList.length > 1);
  const items = open ? songList : [];
  const focusIndex = Math.max(0, activeIndex);
  const current = items[focusIndex];

  // "Deal out": every time a fresh list arrives the records start stacked in
  // the centre, then fan out along the arc on the next frames. Deriving
  // `dealt` from the list signature avoids a one-frame flash of the final
  // layout when the list is replaced.
  const signature = items.map((i) => i._id || i.url).join('|');
  const [dealtFor, setDealtFor] = useState('');
  const [settledFor, setSettledFor] = useState('');
  const dealt = signature !== '' && dealtFor === signature;
  const settled = signature !== '' && settledFor === signature;

  useEffect(() => {
    if (!signature) return undefined;
    let raf2;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setDealtFor(signature));
    });
    const timer = setTimeout(() => setSettledFor(signature), 1100);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(timer);
    };
  }, [signature]);

  // Horizontal swipe on touch / mouse → previous / next record.
  const startX = useRef(null);
  const justSwiped = useRef(false);

  const onPointerDown = (e) => {
    startX.current = e.clientX;
  };
  const onPointerUp = (e) => {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) > 40) {
      justSwiped.current = true;
      setTimeout(() => { justSwiped.current = false; }, 0);
      stepSong(dx < 0 ? 1 : -1);
    }
  };
  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); stepSong(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); stepSong(1); }
  };

  const onRecordClick = (item, distance) => {
    if (justSwiped.current || distance === 0) return;
    playSong(item);
  };

  return (
    <div
      className={`orbit ${open ? 'is-open' : ''}`}
      role="group"
      aria-label="Records for this mood"
      aria-hidden={!open}
      tabIndex={open ? 0 : -1}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => { startX.current = null; }}
    >
      {open && current && (
        <div className="orbit__label">
          <button
            type="button"
            className="orbit__nav"
            onClick={() => stepSong(-1)}
            disabled={focusIndex === 0}
            aria-label="Previous record"
          >‹</button>

          <div className="orbit__text" key={current._id || current.url} aria-live="polite">
            <span className="orbit__title">{current.title}</span>
            <span className="orbit__count">{focusIndex + 1} / {items.length}</span>
          </div>

          <button
            type="button"
            className="orbit__nav"
            onClick={() => stepSong(1)}
            disabled={focusIndex === items.length - 1}
            aria-label="Next record"
          >›</button>
        </div>
      )}

      {items.map((item, i) => {
        const d = i - focusIndex;
        const ad = Math.abs(d);
        const shown = dealt && ad <= VISIBLE;

        // Clamp so far-away (hidden) records park just outside the arc
        // instead of swinging round to the other side of the porthole.
        const angle = Math.max(-(VISIBLE + 1), Math.min(VISIBLE + 1, d)) * STEP;
        const scale = SCALE[Math.min(ad, VISIBLE)] ?? 0.5;

        // rotate → push out → counter-rotate keeps the same function list in
        // every state, so the browser interpolates the *angle* and each
        // record travels along a true circular path.
        const transform = dealt
          ? `rotate(${angle}deg) translateY(calc(var(--orbit-r) * -1)) rotate(${-angle}deg) scale(${scale})`
          : 'rotate(0deg) translateY(0px) rotate(0deg) scale(0.2)';

        const isFocus = d === 0;
        const isSpinning = isFocus && isPlaying && sameSong(item, song);

        return (
          <button
            key={item._id || item.url}
            type="button"
            className={`record ${isFocus ? 'is-focus' : ''} ${isSpinning ? 'is-playing' : ''}`}
            style={{
              transform,
              opacity: shown ? OPACITY[ad] : 0,
              zIndex: 20 - ad,
              pointerEvents: shown ? 'auto' : 'none',
              transitionDelay: settled ? '0ms' : `${i * 45}ms`,
            }}
            tabIndex={shown ? 0 : -1}
            aria-label={`Play ${item.title}`}
            onClick={() => onRecordClick(item, d)}
          >
            <span className="record__disc">
              <img className="record__art" src={item.posterUrl} alt="" loading="lazy" draggable={false} />
              <span className="record__grooves" />
              <span className="record__hole" />
            </span>
            <span className="record__sheen" />
          </button>
        );
      })}
    </div>
  );
}