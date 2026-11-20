// Vercel entry point. Vercel runs this file as a serverless function; every
// /api/* request is rewritten to it (see vercel.json). The Express app itself
// lives in Backend/src and is the very same one `node Backend/server.js` runs.

const app = require('../Backend/src/app')
const connectToDb = require('../Backend/src/config/database')

const REQUIRED = ['MONGO_URI', 'JWT_SECRET']

function fail(res, status, message) {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    res.end(JSON.stringify({ message }))
}

module.exports = async (req, res) => {
    const missing = REQUIRED.filter((key) => !process.env[key])
    if (missing.length) {
        console.error(`Missing required environment variables: ${missing.join(', ')}`)
        return fail(res, 500, 'Server is not configured')
    }

    try {
        // reuses the open connection while this instance stays warm
        await connectToDb()
    } catch (err) {
        console.error('Database connection failed:', err.message)
        return fail(res, 503, 'Database unavailable')
    }

    return app(req, res)
}