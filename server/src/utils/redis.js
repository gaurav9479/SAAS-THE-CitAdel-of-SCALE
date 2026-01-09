// src/utils/redis.js
import { createClient } from "redis";

let client = null;
let isConnected = false;

// Only create Redis client if REDIS_URL is provided
if (process.env.REDIS_URL) {
    try {
        client = createClient({
            url: process.env.REDIS_URL
        });

        client.on("error", err => {
            console.error("Redis Client Error", err);
            isConnected = false;
        });

        client.on("connect", () => {
            console.log("Redis Client Connected");
            isConnected = true;
        });

        client.on("disconnect", () => {
            console.log("Redis Client Disconnected");
            isConnected = false;
        });

        // Connect asynchronously, don't block startup
        client.connect().then(() => {
            isConnected = true;
            console.log("Redis connected successfully");
        }).catch(err => {
            console.warn("Redis connection failed (caching disabled):", err.message);
            isConnected = false;
            client = null;
        });
    } catch (err) {
        console.warn("Redis initialization failed (caching disabled):", err.message);
        client = null;
        isConnected = false;
    }
} else {
    console.log("Redis not configured (REDIS_URL not set). Caching disabled.");
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
