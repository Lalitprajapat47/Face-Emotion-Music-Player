import React, { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router'
import AuthShell from '../components/AuthShell'
import PasswordField from '../components/PasswordField'
import { useAuth } from '../hooks/useAuth'
import { validateLogin } from '../utils/validate'
import '../style/auth.scss'

const Login = () => {
  const { user, ready, loading, handleLogin } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')

  useEffect(() => {
    document.title = 'Log in · Moodify'
  }, [])

  // wait for the first session check, and don't show the form to someone who is already in
  if (!ready) return null
  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    if (loading) return

    setFormError('')
    const found = validateLogin({ email, password })
    setErrors(found)
    if (Object.keys(found).length) return

    const result = await handleLogin({ email: email.trim(), password })
    // on success `user` is set and the guard above redirects to the app
    if (!result.ok) setFormError(result.message)
  }

  return (
    <AuthShell>
      <div className="auth__panel">
        <h1 className="auth__title">Log in to Moodify</h1>
        <p className="auth__sub">Welcome back. Your next mix is one look away.</p>

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
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
              autoComplete="current-password"
              placeholder="Your password"
              invalid={Boolean(errors.password)}
              describedBy={errors.password ? 'password-error' : undefined}
            />
            {errors.password && <p className="field__error" id="password-error">{errors.password}</p>}
          </div>

          {formError && <p className="auth__alert" role="alert">{formError}</p>}

          <button type="submit" className="auth__submit" disabled={loading}>
            {loading ? (<><span className="auth__spinner" aria-hidden="true" />Logging in…</>) : 'Log in'}
          </button>
        </form>

        <p className="auth__switch">
          Don't have an account? <Link to="/register">Sign up for Moodify</Link>
        </p>
      </div>
    </AuthShell>
  )
}

export default Login