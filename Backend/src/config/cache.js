
const Redis = require("ioredis");

if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is missing in environment variables");
}

const redis = new Redis(process.env.REDIS_URL, {
    connectTimeout: 10000,
    maxRetriesPerRequest: 3,

    retryStrategy(times) {
        return Math.min(times * 1000, 5000);
    },

    keepAlive: 10000,
});

redis.on("connect", () => {
    console.log("Redis connection established");
});

redis.on("ready", () => {
    console.log("Redis is ready");
});

redis.on("error", (err) => {
    console.error("Redis error:", err.message);
});

redis.on("close", () => {
    console.warn("Redis connection closed");
});

module.exports = redis;
