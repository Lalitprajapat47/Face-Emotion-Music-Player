import React from 'react'
import { Link } from 'react-router'
import '../style/login.scss'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router'
import { useState } from 'react'

const Login = () => {

  const { loading, handleLogin } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    await handleLogin({ email, password })
    navigate('/')
  }

  return (
    <main className="auth-page login-page">
      <section className="auth-card">
        <div className="auth-card__content">
          <div className="auth-card__hero">
            <p className="eyebrow">Welcome back</p>
            <h1>Sign in to Moodify</h1>
            <p>Analyze facial expressions and keep your mood insights moving forward.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Email address</label>
            <input
              type="email" id="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />

            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />

            <button type="submit">Login</button>

            <p className="auth-form__footer">
              New here? <Link to="/register">Create an account</Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  )
}

export default Login