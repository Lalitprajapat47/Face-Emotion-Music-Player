const express = require('express');
const path = require('path');
const cookieParser = require("cookie-parser")
const cors = require('cors');

const app = express();
const isProduction = process.env.NODE_ENV === 'production'

app.disable('x-powered-by')

// Behind Render / a load balancer every request arrives from the proxy's IP;
// the real visitor is in X-Forwarded-For. Without this, rate limiting would
// treat ALL users as one person.
// TRUST_PROXY = how many proxies sit in front of this app:
//   1 -> only the host's load balancer (Render / AWS), the default
//   2 -> Vercel in front of Render (Vercel -> Render's load balancer -> app)
// Open /api/health and check that "ip" is YOUR public IP; if it shows a
// Vercel / Render address instead, change this number.
if (isProduction) {
    const hops = Number.parseInt(process.env.TRUST_PROXY, 10)
    app.set('trust proxy', Number.isInteger(hops) && hops >= 0 ? hops : 1)
}

// FRONTEND_URL / CLIENT_URL may hold several origins separated by commas.
const fromEnv = (value) => (value || '').split(',').map((o) => o.trim().replace(/\/+$/, '')).filter(Boolean)

// Remove any origin you no longer deploy to — with credentials enabled each
// entry here is a site that may act on behalf of a logged-in user.
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4000',
    'https://face-emotion-music-player.onrender.com',
    'https://face-emotion-music-player-frontend.onrender.com',
    'http://moodify-aws-alb-1957176276.ap-northeast-1.elb.amazonaws.com',
    ...fromEnv(process.env.FRONTEND_URL),
    ...fromEnv(process.env.CLIENT_URL),
].filter(Boolean);

app.use(express.static('public'));
app.use(express.json({ limit: '10kb' }))   // auth bodies are tiny; uploads use multipart
app.use(cookieParser())
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// API answers are per-user, so nothing between the server and the browser
// (a CDN such as Vercel's, or the browser itself) may store them.
app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
})

// Liveness check (also handy for an uptime pinger). "ip" is the address this
// server believes the caller has — use it to check TRUST_PROXY (see above).
app.get('/api/health', (req, res) => {
    res.json({ ok: true, ip: req.ip })
})

const authRoutes = require('./routes/auth.routes')
const songRoutes = require('./routes/song.routes')
app.use('/api/songs', songRoutes)

app.use('/api/auth', authRoutes)

// Single-page app: any other page-style GET (/login, /register, a refresh on /,
// …) gets index.html so the React router can take over. Without this, opening
// or refreshing /login on the deployed site answers "Cannot GET /login".
// API calls and requests for files with an extension (.js, .css, .png …) are
// left alone, so a missing asset is still a real 404.
app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api') || path.extname(req.path)) {
        return next()
    }
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'), (err) => {
        if (err && !res.headersSent) next()
    })
})

// Last stop for anything that throws: clean JSON, and no stack traces or
// internal messages leaked to the browser in production.
app.use((err, req, res, next) => {
    if (res.headersSent) return next(err)

    if (err?.message?.startsWith('CORS blocked')) {
        return res.status(403).json({ message: 'Origin not allowed' })
    }
    if (err?.type === 'entity.too.large') {
        return res.status(413).json({ message: 'Request body too large' })
    }
    if (err?.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Invalid JSON' })
    }

    console.error(err)
    res.status(500).json({
        message: isProduction ? 'Something went wrong' : (err?.message || 'Something went wrong')
    })
})

module.exports = app