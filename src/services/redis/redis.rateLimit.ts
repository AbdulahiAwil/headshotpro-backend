import { logger } from "@/util/logger";
import { redisClient } from "./redis.client";


export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: Date;

}

class RedisRateLimiteService {

    // Check rate limit

    async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {

        // Fail open if Redis is not connected

        if (!redisClient.isConnected()) {
            return {
                allowed: true,
                remaining: limit,
                resetAt: new Date(Date.now() + windowSeconds * 1000),
            };
        }

        try {

            // Increment the count and get the current value

            const count = await redisClient.incr(key);

            // Set expiration time

            if (count === 1) {
                await redisClient.expire(key, windowSeconds);
            }

            // Calculate remaining and reset time

            const allowed = count <= limit;
            const remaining = Math.max(0, limit - count);

            // Get ttl

            const ttl = await redisClient.ttl(key);
            const resetAt = Date.now() + ttl * 1000;

            if(!allowed) {
                logger.warn(`Rate limit exceeded for key: ${key}`)
            }
            return {
                allowed,
                remaining,
                resetAt: new Date(resetAt),
            };
            
            
        } catch (error) {
            logger.error("Failed to check rate limit in Redis:", error);
            // Fail open on error
            return {
                allowed: true,
                remaining: limit,
                resetAt: new Date(Date.now() + windowSeconds * 1000),
            };
            
        }
    }

    // Reset rate limit

    async resetRateLimit(key: string): Promise<void> {

        if (!redisClient.isConnected()) return;

        try {
            await redisClient.del(key);
            logger.info(`Rate limit reset for key: ${key}`);
        } catch (error) {

            logger.error("Failed to reset rate limit in Redis:", error);
            
        }
    }

    // Get rate limit without incrementing counter

    async getRateLimit(key: string, limit: number): Promise<RateLimitResult> {

        if (!redisClient.isConnected()) {
            return {
                allowed: true,
                remaining: limit,
                resetAt: new Date(Date.now())
            };
        }

        try {

            const count = await redisClient.get(key);
            const currentCount = count ? parseInt(count, 10) : 0;
            const ttl = await redisClient.ttl(key);

            return {
                allowed: currentCount < limit,
                remaining: Math.max(0, limit - currentCount),
                resetAt: new Date(Date.now() + ttl * 1000),
            };
            
        } catch (error) {

            logger.error("Failed to get rate limit from Redis:", error);
            return {
                allowed: true,
                remaining: limit,
                resetAt: new Date(Date.now())
            };
            
        }
    }


}

export const redisRateLimitService = new RedisRateLimiteService();