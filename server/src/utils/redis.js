// src/utils/redis.js
import { createClient } from "redis";

let client = null;
let isConnected = false;
let connectionAttempted = false;

// Only create Redis client if REDIS_URL is provided and not pointing to localhost in production
const redisUrl = process.env.REDIS_URL;
const isLocalhost = redisUrl && (redisUrl.includes('127.0.0.1') || redisUrl.includes('localhost'));

if (redisUrl && !isLocalhost) {
    try {
        client = createClient({
            url: redisUrl,
            socket: {
                reconnectStrategy: false // Disable auto-reconnect to prevent connection spam
            }
        });

        client.on("error", err => {
            // Only log error once to avoid spam
            if (!connectionAttempted) {
                console.warn("Redis Client Error:", err.message);
                console.warn("Redis caching will be disabled. App will function normally without Redis.");
            }
            isConnected = false;
            connectionAttempted = true;
        });

        client.on("connect", () => {
            console.log("Redis Client Connected");
            isConnected = true;
            connectionAttempted = true;
        });

        client.on("disconnect", () => {
            console.log("Redis Client Disconnected");
            isConnected = false;
        });

        // Connect asynchronously, don't block startup
        client.connect().then(() => {
            isConnected = true;
            connectionAttempted = true;
            console.log("Redis connected successfully");
        }).catch(err => {
            console.warn("Redis connection failed (caching disabled):", err.message);
            console.warn("App will function normally without Redis caching.");
            isConnected = false;
            connectionAttempted = true;
            // Don't set client to null here - keep it but mark as disconnected
            // This prevents reconnection attempts
            try {
                client.quit().catch(() => {}); // Gracefully close if possible
            } catch (e) {
                // Ignore quit errors
            }
        });
    } catch (err) {
        console.warn("Redis initialization failed (caching disabled):", err.message);
        client = null;
        isConnected = false;
        connectionAttempted = true;
    }
} else if (redisUrl && isLocalhost) {
    console.warn("Redis URL points to localhost. Skipping Redis connection in production.");
    console.warn("If you need Redis, use a cloud Redis service (Upstash, Render Redis, etc.)");
    console.warn("App will function normally without Redis caching.");
} else {
    console.log("Redis not configured (REDIS_URL not set). Caching disabled.");
    console.log("App will function normally without Redis caching.");
}

// Helper functions to safely use Redis
export async function get(key) {
    if (!client || !isConnected) return null;
    try {
        return await client.get(key);
    } catch (err) {
        console.warn("Redis get error:", err.message);
        return null;
    }
}

export async function set(key, value, options = {}) {
    if (!client || !isConnected) return false;
    try {
        await client.set(key, value, options);
        return true;
    } catch (err) {
        console.warn("Redis set error:", err.message);
        return false;
    }
}

export async function del(key) {
    if (!client || !isConnected) return false;
    try {
        await client.del(key);
        return true;
    } catch (err) {
        console.warn("Redis del error:", err.message);
        return false;
    }
}

export async function keys(pattern) {
    if (!client || !isConnected) return [];
    try {
        return await client.keys(pattern);
    } catch (err) {
        console.warn("Redis keys error:", err.message);
        return [];
    }
}

export function isRedisAvailable() {
    return client !== null && isConnected;
}

// Export client for advanced usage (with null check)
export default client;
