import React from 'react'
import { Link } from 'react-router'
import '../style/login.scss'

const Login = () => {

  

  return (
    <main className="auth-page login-page">
      <section className="auth-card">
        <div className="auth-card__content">
          <div className="auth-card__hero">
            <p className="eyebrow">Welcome back</p>
            <h1>Sign in to Moodify</h1>
            <p>Analyze facial expressions and keep your mood insights moving forward.</p>
          </div>

          <form className="auth-form">
            <label htmlFor="email">Email address</label>
            <input type="email" id="email" placeholder="you@example.com" />

            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="Enter your password" />

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