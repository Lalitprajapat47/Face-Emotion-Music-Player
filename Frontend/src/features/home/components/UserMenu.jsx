import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../auth/hooks/useAuth';
import '../style/user-menu.scss';

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

/**
 * Who's logged in + the log out action. Sits in the top bar: a round avatar
 * (first letter of the username, in the current mood colour) that opens a
 * small menu.
 */
export default function UserMenu() {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // close on outside click / Escape
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!user) return null;

  const initial = (user.username || user.email || '?').trim().charAt(0).toUpperCase();

  const onLogout = async () => {
    setOpen(false);
    await handleLogout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="user-menu" ref={rootRef}>
      <button
        type="button"
        className="user-menu__btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="user-menu__avatar" aria-hidden="true">{initial}</span>
        <span className="user-menu__name">{user.username}</span>
        <span className={`user-menu__chevron ${open ? 'is-open' : ''}`}><ChevronIcon /></span>
      </button>

      {open && (
        <div className="user-menu__panel" role="menu">
          <div className="user-menu__who">
            <strong>{user.username}</strong>
            <span>{user.email}</span>
            {user.isAdmin && <em className="user-menu__badge">Admin</em>}
          </div>
          <button type="button" role="menuitem" className="user-menu__item" onClick={onLogout}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}