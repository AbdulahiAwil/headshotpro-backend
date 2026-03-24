import { logger } from "@/util/logger";
import { redisClient } from "./redis.client";


class RedisCacheService {

    async set<T>(key: string, value: T, ttl: number): Promise<void> {
        if (!redisClient.isConnected()) return;

        try {
            const serializedValue = JSON.stringify(value);
            await redisClient.setex(key, ttl, serializedValue);
            
        } catch (error) {

            logger.error("Failed to set cache in Redis:", error);
            
        }

    }

    async get<T>(key: string): Promise<T | null> {
        if (!redisClient.isConnected()) return null;

        try {
            const value = await redisClient.get(key);
            if (!value) return null;
            logger.info(`Cache hit for key: ${key} with value: ${JSON.stringify(value)}`);
            return JSON.parse(JSON.stringify(value)) as T;
        } catch (error) {
            logger.error("Failed to get cache from Redis:", error);
            return null;
            
        }
    }

    async delete(key: string): Promise<void> {
        if (!redisClient.isConnected()) return;

        try {
            await redisClient.del(key);
            logger.info(`Cache deleted for key: ${key}`);
        } catch (error) {
            logger.error("Failed to delete cache from Redis:", error);
    }
}

// Clear all cache using pattern
    async deletePattern(pattern: string): Promise<void> {
        if (!redisClient.isConnected()) return;

        try {

            const rawClient = redisClient.getClient();
            if (!rawClient) return;

            // orders: page:1:status:completed

            const keys : string[] = [];
            let cursor = 0;

            do {
                const result: any = await rawClient.scan(cursor, 
                    {
                        match: pattern,
                        count: 100
                    });

                    if (Array.isArray(result) && result.length >= 2) {
                        const cursorValue = result[0];
                        const keysFound = result[1];  // data ayuu wadaa

                        cursor = 
                        typeof cursorValue === 'number' ? 
                        cursorValue : parseInt(cursorValue, 10);

                        // Collect all found keys

                        if (Array.isArray(keysFound)) {
                            keys.push(...keysFound);
                        }else {
                            break; // No more keys found, exit loop
                        }
                    }
                    
            }while (cursor !== 0);
                    if (keys.length > 0) {
                        await Promise.all(keys.map(key => rawClient.del(key)));
                        logger.info(`Deleted ${keys.length} keys matching pattern: ${pattern}`);
                    }
            
        } catch (error) {
            logger.error("Failed to delete cache with pattern from Redis:", error);
            
        }
    }


}

export const redisCacheService = new RedisCacheService()