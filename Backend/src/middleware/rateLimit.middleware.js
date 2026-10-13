const { rateLimit } = require("express-rate-limit")

const tooMany = (message) => (req, res) => res.status(429).json({ message })

// Login: at most 10 *failed* attempts per 15 minutes per IP.
// (skipSuccessfulRequests => a normal successful login never counts.)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: tooMany("Too many login attempts. Please try again in a few minutes."),
})

// Register: at most 10 sign-up requests per hour per IP.
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: tooMany("Too many sign-up attempts. Please try again later."),
})

module.exports = { loginLimiter, registerLimiter }