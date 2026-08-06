import React from 'react'
import { Link } from 'react-router'
import '../style/register.scss'

const Register = () => {
  return (
    <main className="auth-page register-page">
      <section className="auth-card">
        <div className="auth-card__content">
          <div className="auth-card__hero">
            <p className="eyebrow">Start fresh</p>
            <h1>Create your account</h1>
            <p>Join Moodify to unlock smarter expression tracking and a better experience.</p>
          </div>

          <form className="auth-form">
            <label htmlFor="name">Full name</label>
            <input type="text" id="name" placeholder="Alex Morgan" />

            <label htmlFor="email">Email address</label>
            <input type="email" id="email" placeholder="you@example.com" />

            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="Create a password" />

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