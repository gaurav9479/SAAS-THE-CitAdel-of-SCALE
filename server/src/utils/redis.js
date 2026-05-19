import { Redis } from "@upstash/redis";

const isConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL && 
  process.env.UPSTASH_REDIS_REST_TOKEN &&
  !process.env.UPSTASH_REDIS_REST_URL.includes("your-upstash-url")
);

export let redis = null;

if (isConfigured) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log("🚀 Upstash Redis client initialized successfully.");
} else {
    console.warn("⚠️ Upstash Redis is not configured (UPSTASH_REDIS_REST_URL/TOKEN not set). Caching is disabled.");
}

export async function get(key) {
    if (!redis) return null;
    try {
        const val = await redis.get(key);
        if (val === null || val === undefined) return null;
        if (typeof val === 'object') {
            return JSON.stringify(val);
        }
        return val;
    } catch (err) {
        console.warn("Upstash Redis get error:", err.message);
        return null;
    }
}

export async function set(key, value, options = {}) {
    if (!redis) return false;
    try {
        const upstashOptions = {};
        if (options.EX !== undefined) {
            upstashOptions.ex = options.EX;
        } else if (options.ex !== undefined) {
            upstashOptions.ex = options.ex;
        }
        // If value is a stringified object, or object, Upstash SDK can handle it
        let parsedValue = value;
        try {
            if (typeof value === 'string') {
                parsedValue = JSON.parse(value);
            }
        } catch (e) {
            // Ignore if it's not a JSON string, treat as plain string
        }
        
        await redis.set(key, parsedValue, upstashOptions);
        return true;
    } catch (err) {
        console.warn("Upstash Redis set error:", err.message);
        return false;
    }
}

export async function del(key) {
    if (!redis) return false;
    try {
        await redis.del(key);
        return true;
    } catch (err) {
        console.warn("Upstash Redis del error:", err.message);
        return false;
    }
}

export async function keys(pattern) {
    if (!redis) return [];
    try {
        return await redis.keys(pattern);
    } catch (err) {
        console.warn("Upstash Redis keys error:", err.message);
        return [];
    }
}

export function isRedisAvailable() {
    return redis !== null;
}

export default redis;
