import React, { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router'
import AuthShell from '../components/AuthShell'
import PasswordField from '../components/PasswordField'
import { useAuth } from '../hooks/useAuth'
import { validateRegister, MIN_PASSWORD } from '../utils/validate'
import '../style/auth.scss'

const Register = () => {
  const { user, ready, loading, handleRegister } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')

  useEffect(() => {
    document.title = 'Sign up · Moodify'
  }, [])

  if (!ready) return null
  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return

    setFormError('')
    const found = validateRegister({ username, email, password })
    setErrors(found)
    if (Object.keys(found).length) return

    const result = await handleRegister({ username: username.trim(), email: email.trim(), password })
    if (!result.ok) setFormError(result.message)
  }

  return (
    <AuthShell>
      <div className="auth__panel">
        <h1 className="auth__title">Sign up for Moodify</h1>
        <p className="auth__sub">Make an account, look at the camera, and get a mix that matches your mood.</p>

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Alex Morgan"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-invalid={errors.username ? 'true' : 'false'}
              aria-describedby={errors.username ? 'username-error' : undefined}
            />
            {errors.username && <p className="field__error" id="username-error">{errors.username}</p>}
          </div>

          <div className="field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && <p className="field__error" id="email-error">{errors.email}</p>}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <PasswordField
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Create a password"
              invalid={Boolean(errors.password)}
              describedBy={errors.password ? 'password-error' : 'password-hint'}
            />
            {errors.password
              ? <p className="field__error" id="password-error">{errors.password}</p>
              : <p className="field__hint" id="password-hint">At least {MIN_PASSWORD} characters.</p>}
          </div>

          {formError && <p className="auth__alert" role="alert">{formError}</p>}

          <button type="submit" className="auth__submit" disabled={loading}>
            {loading ? (<><span className="auth__spinner" aria-hidden="true" />Creating account…</>) : 'Create account'}
          </button>
        </form>

        <p className="auth__switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </AuthShell>
  )
}

export default Register