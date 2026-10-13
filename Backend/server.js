require("dotenv").config();

// Fail loudly at start-up instead of with confusing errors on the first request
const missing = [ 'MONGO_URI', 'JWT_SECRET' ].filter((key) => !process.env[key])
if (missing.length) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`)
    process.exit(1)
}

if (process.env.JWT_SECRET.length < 32) {
    console.warn('JWT_SECRET is short — use a long random string (32+ characters).')
}
if (!process.env.ADMIN_EMAILS) {
    console.warn('ADMIN_EMAILS is not set — nobody can upload songs until you add your email to .env')
}

const app = require('./src/app')
const connectToDb = require('./src/config/database')


connectToDb()

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})