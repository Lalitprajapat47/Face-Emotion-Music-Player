const Redis = require("ioredis").default;

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    // Keep ioredis's default retry behaviour (20). A Redis connection that
    // sat idle gets dropped by the provider; the next command has to wait
    // for the reconnect, and a low limit makes that first request fail.
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