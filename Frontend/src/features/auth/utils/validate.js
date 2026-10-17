// Mirrors Backend/src/middleware/validate.middleware.js, so people get instant
// feedback. The server still re-checks everything — keep the two in sync.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_RE = /^[\w.\- ]{3,30}$/

export const MIN_PASSWORD = 8
export const MAX_PASSWORD = 128

function emailError(email) {
  const value = email.trim()
  if (!value) return 'Enter your email address.'
  if (value.length > 254 || !EMAIL_RE.test(value)) return 'That email address doesn’t look right.'
  return null
}

export function validateLogin({ email, password }) {
  const errors = {}
  const e = emailError(email)
  if (e) errors.email = e
  if (!password) errors.password = 'Enter your password.'
  return errors
}

export function validateRegister({ username, email, password }) {
  const errors = {}

  const name = username.trim()
  if (!name) errors.username = 'Choose a username.'
  else if (!USERNAME_RE.test(name)) errors.username = 'Use 3–30 characters: letters, numbers, spaces, . _ -'

  const e = emailError(email)
  if (e) errors.email = e

  if (!password) errors.password = 'Create a password.'
  else if (password.length < MIN_PASSWORD) errors.password = `Use at least ${MIN_PASSWORD} characters.`
  else if (password.length > MAX_PASSWORD) errors.password = `Use at most ${MAX_PASSWORD} characters.`

  return errors
}