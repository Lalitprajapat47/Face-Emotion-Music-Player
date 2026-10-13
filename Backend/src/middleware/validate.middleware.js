const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_RE = /^[\w.\- ]{3,30}$/

const MIN_PASSWORD = 8      // for new accounts
const MAX_PASSWORD = 128    // bcrypt only uses the first 72 bytes anyway

const isString = (v) => typeof v === "string"

// Only plain strings are accepted. That alone shuts out NoSQL-injection
// payloads like { "email": { "$ne": null } }, which arrive as objects.
function validateRegister(req, res, next) {
    const { username, email, password } = req.body || {}

    if (![username, email, password].every(isString)) {
        return res.status(400).json({ message: "Username, email and password are required" })
    }

    const clean = { username: username.trim(), email: email.trim(), password }

    if (!USERNAME_RE.test(clean.username)) {
        return res.status(400).json({ message: "Username must be 3-30 characters (letters, numbers, spaces, . _ -)" })
    }
    if (clean.email.length > 254 || !EMAIL_RE.test(clean.email)) {
        return res.status(400).json({ message: "Please enter a valid email address" })
    }
    if (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) {
        return res.status(400).json({ message: `Password must be ${MIN_PASSWORD}-${MAX_PASSWORD} characters long` })
    }

    req.body = clean
    next()
}

// Login accepts email OR username. Password length is NOT enforced here, so
// accounts created before the 8-character rule can still sign in.
function validateLogin(req, res, next) {
    const { username, email, password } = req.body || {}

    for (const value of [username, email]) {
        if (value !== undefined && !isString(value)) {
            return res.status(400).json({ message: "Invalid credentials" })
        }
    }
    if (!isString(password) || password.length === 0 || password.length > MAX_PASSWORD) {
        return res.status(400).json({ message: "Invalid credentials" })
    }

    const identifier = {
        username: username?.trim() || undefined,
        email: email?.trim() || undefined,
    }
    if (!identifier.username && !identifier.email) {
        return res.status(400).json({ message: "Please provide an email or username" })
    }

    req.body = { ...identifier, password }
    next()
}

module.exports = { validateRegister, validateLogin }