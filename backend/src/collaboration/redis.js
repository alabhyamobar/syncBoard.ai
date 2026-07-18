import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

let redisClient = null;
let subClient = null;
let isRedisReady = false;
let connectionFailed = false;

try {
  console.log(`[Redis] Connecting to ${redisUrl}...`);
  
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    retryStrategy(times) {
      if (times > 2) {
        if (!connectionFailed) {
          console.warn("[Redis] Local Redis connection refused or not running. Operating in fallback local-memory mode.");
          connectionFailed = true;
        }
        isRedisReady = false;
        return null;
      }
      return 100;
    }
  });

  subClient = redisClient.duplicate();

  redisClient.on("connect", () => {
    isRedisReady = true;
    console.log("[Redis] Connected successfully.");
  });

  redisClient.on("error", (err) => {
    if (err.code === "ECONNREFUSED") {
      if (!connectionFailed) {
        console.warn("[Redis] Local Redis connection refused or not running. Operating in fallback local-memory mode.");
        connectionFailed = true;
      }
    } else {
      console.warn(`[Redis] Connection error: ${err.message}`);
    }
    isRedisReady = false;
  });

  subClient.on("error", (err) => {
    if (err.code !== "ECONNREFUSED") {
      console.warn(`[Redis] Sub client error: ${err.message}`);
    }
    isRedisReady = false;
  });
} catch (error) {
  console.warn(`[Redis] Failed to initialize clients: ${error.message}. Operating in fallback mode.`);
  isRedisReady = false;
}

export { redisClient, subClient, isRedisReady };
