
import { redisClient } from '@/services/redis';
import { redisRateLimitService } from '@/services/redis/redis.rateLimit';
import { TooManyRequestsError } from '@/util/error';
import { logger } from '@/util/logger';
import { Request, Response, NextFunction } from 'express';

export interface RateLimitConfig {

    maxRequests: number; // Maximum number of requests allowed
    windowSeconds: number; // Time window in seconds
    identifierType: "ip" | "email"
    keyPrefix: string; // Prefix for Redis keys to avoid collisions
    message?: string; // Message to return when rate limit is exceeded
}


function getIdentifier(req: Request, config: RateLimitConfig): string {
    if (config.identifierType === "email") {
        const email = (req.body as any)?.email;

        if(!email) {
            // fallback to IP if email is not provided

            return getClientIp(req);
        }
        return email.toLowerCase().trim();


    }
    // Default to IP-based identifier
    return getClientIp(req);
}

function getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];

    if (forwarded) {
        const ips = 
            typeof forwarded === 'string' ? forwarded.split(',') : forwarded;   
            return ips[0]?.trim() || '';
    }

    // fallback to connection remote address

    return (
        (req.headers['x-real-ip'] as string) || req.socket.remoteAddress || ''
    )
}

// Format duration in human-readable format

function formatDuration(seconds: number): string {

    if (seconds < 60) {
        return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }

    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
}

export function rateLimitMiddleware(config: RateLimitConfig) {

    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!redisClient.isConnected()) {
                // If Redis is not connected, allow all requests (fail open)
                logger.warn("Redis not connected.");
                return next();
            }

            const identifier = getIdentifier(req, config);

            // key

            const redisKey = `${config.keyPrefix}:${identifier}`;

            // Check rate limit

            const { allowed, remaining, resetAt } = await redisRateLimitService.checkRateLimit(
                redisKey, 
                config.maxRequests, 
                config.windowSeconds
            );

            // Set rate limit headers
            res.setHeader('X-RateLimit-Limit', config.maxRequests);
            res.setHeader('X-RateLimit-Remaining', remaining);
            res.setHeader('X-RateLimit-Reset', resetAt.toISOString());

            if (!allowed) {
                logger.warn(`Rate limit exceeded for identifier: ${redisKey}`);
                
                const message = config.message || "Too many requests. Please try again later.";
                throw new TooManyRequestsError(message);
            }
            next();

        } catch (error) {
            next(error);
            
        }
    }
}