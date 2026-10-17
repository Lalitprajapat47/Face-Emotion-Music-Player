import React from 'react'
import { Link } from 'react-router'
import AmbientBackground from '../../home/components/AmbientBackground'
import '../style/auth.scss'

// Shared frame for the login and register pages: the same flowing ribbons as
// the main app (softened), the wordmark, and a centred column.
export default function AuthShell({ children }) {
  return (
    <>
      <AmbientBackground mood="detecting" dim />

      <div className="auth">
        <header className="auth__top">
          <Link to="/" className="auth__logo">Moodify</Link>
        </header>

        <main className="auth__main">{children}</main>

        <footer className="auth__foot">Your camera never leaves this device.</footer>
      </div>
    </>
  )
}