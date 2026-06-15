import { Redis } from 'ioredis';
import { env } from '../config/env.js';

export function createRedisClient(): Redis {
  return new Redis(env.redisUrl, { maxRetriesPerRequest: null });
}

export class UrlCache {
  constructor(private readonly client: Redis) {}

  private key(code: string): string {
    return `url:${code}`;
  }

  async get(code: string): Promise<string | null> {
    return this.client.get(this.key(code));
  }

  async set(code: string, originalUrl: string): Promise<void> {
    await this.client.set(this.key(code), originalUrl, 'EX', env.redisTtlSeconds);
  }

  async close(): Promise<void> {
    await this.client.quit();
  }
}
