import config from "@/config";
import { AppError } from "@/util/error";
import { logger } from "@/util/logger";
import { Redis } from "@upstash/redis";


class RedisClient {

    private client: Redis | null = null;
    private isEnabled: boolean = false;

    constructor() {
        this.initializeClient();
    }

    private initializeClient(): void {
        const { url, token } = config.upstash;

        if (!url || !token) {
            logger.warn("Upstash Redis configuration is missing. Redis client will not be initialized.");
            this.isEnabled = false;
            return;
        }

        try {
            this.client = new Redis({
                url,
                token,
            })

            this.isEnabled = true;
            logger.info("Upstash Redis client initialized successfully.");
            
        } catch (error) {
            logger.error("Failed to initialize Upstash Redis client:", error);
            this.isEnabled = false;
            throw new AppError("Failed to initialize Redis client", 500);
            
        }
    }

    // Is connected

    public isConnected(): boolean {
        return this.isEnabled
    }

    // Get client 

    public getClient(): Redis | null {
        return this.client;
    }

    // Set value with expiration

    async setex(key: string, seconds: number, value: string): Promise<void> {
        if (!this.isConnected()) {
            throw new AppError("Redis client is not connected");
        }
        try {

                await this.client?.setex(key, seconds, value);

            
        } catch (error) {
            logger.error("Failed to set value in Redis:", error);
            throw new AppError("Failed to set value in Redis", 500);
            
        }
    }

    // Get value 

  async get(key: string): Promise<string | null> {
    if (!this.isConnected()) return null;

    try {
        return await this.client!.get(key)
        
    } catch (error) {
        logger.error("Failed to get value from Redis:", error);
        throw new AppError("Failed to get value from Redis", 500);
        
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected()) return;

    try {
        await this.client!.del(key);
        
    } catch (error) {
        logger.error("Failed to delete key from Redis:", error);
        throw new AppError("Failed to delete key from Redis", 500);
        
    }
  }

//   Increment counter
  async incr(key: string): Promise<number> {
    if (!this.isConnected()) return 0;

    try {
        return await this.client!.incr(key);
        
    } catch (error) {
        logger.error("Failed to increment key in Redis:", error);
        throw new AppError("Failed to increment key in Redis", 500);
        }
  }

//   Set Expiration Time
    async expire(key: string, seconds: number): Promise<void> {
        if (!this.isConnected()) return;

        try {
            await this.client!.expire(key, seconds);
        } catch (error) {
            logger.error("Failed to set expiration time for key in Redis:", error);
            throw new AppError("Failed to set expiration time for key in Redis", 500);
        }
    }

    // Get TTL(Time to Live)
    async ttl(key: string): Promise<number> {
        if (!this.isConnected()) return 0;

        try {
            return await this.client!.ttl(key);
        } catch (error) {
            logger.error("Failed to get TTL for key in Redis:", error);
            throw new AppError("Failed to get TTL for key in Redis", 500);
        }
    }
}

export const redisClient = new RedisClient();