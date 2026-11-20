const { rateLimit } = require("express-rate-limit")

const isProduction = process.env.NODE_ENV === "production"

// Where the counters live. In memory is fine for one long-running dev server,
// but in production several instances may run at once (every Vercel request can
// land on a different one) and each would count on its own, so a limit of 10
// would really be 10 per instance. There the counters go to Redis, which the
// app already uses for logout. Override with RATE_LIMIT_STORE=memory|redis.
const useRedis = process.env.RATE_LIMIT_STORE
    ? process.env.RATE_LIMIT_STORE === "redis"
    : isProduction

// Minimal express-rate-limit store on top of Redis: INCR + a fixed window.
class RedisStore {
    constructor(prefix) {
        this.prefix = prefix
    }

    init(options) {
        this.windowMs = options.windowMs
    }

    redis() {
        return require("../config/cache")
    }

    async increment(key) {
        const redis = this.redis()
        const k = this.prefix + key

        const results = await redis.multi().incr(k).pttl(k).exec()
        const totalHits = Number(results[0][1])
        let ttl = Number(results[1][1])

        // first hit of a window — or a key that somehow has no expiry — gets one,
        // so a counter can never stay stuck forever
        if (totalHits === 1 || ttl < 0) {
            await redis.pexpire(k, this.windowMs)
            ttl = this.windowMs
        }

        return { totalHits, resetTime: new Date(Date.now() + ttl) }
    }

    async decrement(key) {
        const redis = this.redis()
        const k = this.prefix + key
        const value = await redis.decr(k)
        if (value <= 0) await redis.del(k)
    }

    async resetKey(key) {
        await this.redis().del(this.prefix + key)
    }
}

// Shared settings. passOnStoreError: if Redis is down, let the request through
// instead of turning every login into a 500.
const common = (name) => ({
    standardHeaders: "draft-7",
    legacyHeaders: false,
    ...(useRedis ? { store: new RedisStore(`rl:${name}:`), passOnStoreError: true } : {}),
})

const tooMany = (message) => (req, res) => res.status(429).json({ message })

// Login: at most 10 *failed* attempts per 15 minutes per IP.
// (skipSuccessfulRequests => a normal successful login never counts.)
const loginLimiter = rateLimit({
    ...common("login"),
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    handler: tooMany("Too many login attempts. Please try again in a few minutes."),
})

// Login, per ACCOUNT: at most 10 failed attempts per 15 minutes for one
// email/username, from anywhere. The per-IP limit above can be dodged by
// anyone who talks to the server directly and fakes X-Forwarded-For; this one
// can't, because it doesn't look at the IP at all. Runs after validateLogin,
// so req.body is already a clean pair of strings.
const accountLimiter = rateLimit({
    ...common("account"),
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => "account:" + String(req.body?.email || req.body?.username || "").trim().toLowerCase(),
    handler: tooMany("Too many failed attempts for this account. Please try again in a few minutes."),
})

// Register: at most 10 sign-up requests per hour per IP.
const registerLimiter = rateLimit({
    ...common("register"),
    windowMs: 60 * 60 * 1000,
    limit: 10,
    handler: tooMany("Too many sign-up attempts. Please try again later."),
})

module.exports = { loginLimiter, accountLimiter, registerLimiter }