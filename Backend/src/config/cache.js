const Redis = require("ioredis").default;

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    // Fail a command after a few tries instead of the default 20: on a
    // serverless function a hung request is worse than a quick error.
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
    // Managed Redis such as Upstash needs TLS: set REDIS_TLS=true
    ...(process.env.REDIS_TLS === "true" ? { tls: {} } : {}),
});

redis.on("connect", () => {
    console.log("Redis connected successfully");
});

redis.on("error", (err) => {
    console.error("Redis connection error:", err);
});

module.exports = redis;