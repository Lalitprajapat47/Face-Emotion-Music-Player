import React from 'react'
import { Link } from 'react-router'
import '../style/register.scss'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'



const Register = () => {
  const { loading, handleRegister } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    await handleRegister({ name, email, password })
    navigate('/')
  }

  return (
    <main className="auth-page register-page">
      <section className="auth-card">
        <div className="auth-card__content">
          <div className="auth-card__hero">
            <p className="eyebrow">Start fresh</p>
            <h1>Create your account</h1>
            <p>Join Moodify to unlock smarter expression tracking and a better experience.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="name">Full name</label>
            <input type="text" id="name" placeholder="Alex Morgan" value={name} onChange={(e) => setName(e.target.value)} />

            <label htmlFor="email">Email address</label>
            <input type="email" id="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />

            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} />

            <button type="submit">Create account</button>

            <p className="auth-form__footer">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  )
}

export default Register