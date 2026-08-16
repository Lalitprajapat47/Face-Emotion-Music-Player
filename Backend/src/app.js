const express = require('express');
const cookieParser = require("cookie-parser")
const cors = require('cors');

const app = express();
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
app.use(express.json())
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

module.exports = app