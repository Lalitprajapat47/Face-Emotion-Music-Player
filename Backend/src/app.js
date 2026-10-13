const express = require('express');
const cookieParser = require("cookie-parser")
const cors = require('cors');

const app = express();
const isProduction = process.env.NODE_ENV === 'production'

app.disable('x-powered-by')

// Behind Render / a load balancer every request arrives from the proxy's IP;
// the real visitor is in X-Forwarded-For. Without this, rate limiting would
// treat ALL users as one person. (1 = trust exactly one proxy hop.)
if (isProduction) {
    app.set('trust proxy', 1)
}

// Remove any origin you no longer deploy to — with credentials enabled each
// entry here is a site that may act on behalf of a logged-in user.
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4000',
    'https://face-emotion-music-player.onrender.com',
    'https://face-emotion-music-player-frontend.onrender.com',
    'http://moodify-aws-alb-1957176276.ap-northeast-1.elb.amazonaws.com',
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
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

const authRoutes = require('./routes/auth.routes')
const songRoutes = require('./routes/song.routes')
app.use('/api/songs', songRoutes)

app.use('/api/auth', authRoutes)

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