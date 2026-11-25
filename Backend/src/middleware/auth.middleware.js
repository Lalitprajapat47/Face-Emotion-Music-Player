const jwt = require('jsonwebtoken')
const redis = require('../config/cache')


async function authUser(req, res, next) {
    const token = req.cookies?.token

    if (!token) {
        return res.status(401).json({ message: "Token not provided" })
    }

    let isTokenBlacklisted
    try {
        isTokenBlacklisted = await redis.get(token)
    } catch (err) {
        // Redis (the logout blacklist) can't be reached. Refuse with a clear
        // answer instead of an internal error, and don't let a possibly
        // logged-out token through.
        console.error("Redis unavailable while checking the token:", err.message)
        return res.status(503).json({ message: "Session service is unavailable. Please try again in a moment." })
    }

    if (isTokenBlacklisted) {
        return res.status(401).json({ message: "Token is blacklisted" })
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            { algorithms: ["HS256"] }
        )
        req.user = decoded
        next()
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" })
    }
}

module.exports = authUser