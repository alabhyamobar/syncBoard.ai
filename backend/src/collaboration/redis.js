import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

let redisClient = null;
let subClient = null;
let isRedisReady = false;

try {
  console.log(`[Redis] Connecting to ${redisUrl}...`);
  
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout: 5000,
    retryStrategy(times) {
      if (times > 3) {
        console.warn("[Redis] Max connection retries exceeded. Operating in fallback local-memory mode.");
        isRedisReady = false;
        return null;
      }
      return Math.min(times * 100, 2000);
    }
  });

  subClient = redisClient.duplicate();

  redisClient.on("connect", () => {
    isRedisReady = true;
    console.log("[Redis] Main client connected successfully.");
  });

  redisClient.on("error", (err) => {
    console.warn(`[Redis] Main client connection error: ${err.message}. Fallback mode active.`);
    isRedisReady = false;
  });

  subClient.on("error", (err) => {
    console.warn(`[Redis] Sub client connection error: ${err.message}. Fallback mode active.`);
    isRedisReady = false;
  });
} catch (error) {
  console.warn(`[Redis] Failed to initialize clients: ${error.message}. Operating in fallback mode.`);
  isRedisReady = false;
}

export { redisClient, subClient, isRedisReady };
