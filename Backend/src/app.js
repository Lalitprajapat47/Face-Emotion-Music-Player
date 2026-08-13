const express = require('express');
const cookieParser = require("cookie-parser")
const cors = require('cors');

const app = express();
const allowedOrigins = [
    'http://localhost:5173',
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
].filter(Boolean);

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error('CORS not allowed for this origin'));
    },
    credentials: true
}))

const authRoutes = require('./routes/auth.routes')
const songRoutes = require('./routes/song.routes')
app.use('/api/songs', songRoutes)

app.use('/api/auth', authRoutes)

module.exports = app