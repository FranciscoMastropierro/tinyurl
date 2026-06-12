import { customAlphabet } from 'nanoid';
import { env } from '../config/env.js';
import { RedisRepository } from '../repositories/redis.repository.js';
import { UrlRepository } from '../repositories/url.repository.js';
import type { CreateUrlResult } from '../types/index.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';

const generateCode = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  7,
);

export class UrlService {
  constructor(
    private readonly urlRepository: UrlRepository,
    private readonly redisRepository: RedisRepository,
  ) {}

  async createUrl(originalUrl: string, alias?: string): Promise<CreateUrlResult> {
    const code = await this.resolveCode(alias);

    const url = await this.urlRepository.create({ code, originalUrl });
    await this.redisRepository.set(code, originalUrl);

    return {
      code: url.code,
      shortUrl: `${env.baseUrl}/${url.code}`,
    };
  }

  async resolveUrl(code: string): Promise<string> {
    const cached = await this.redisRepository.get(code);
    if (cached) {
      return cached;
    }

    const url = await this.urlRepository.findByCode(code);
    if (!url) {
      throw new NotFoundError('URL not found');
    }

    await this.redisRepository.set(code, url.originalUrl);
    return url.originalUrl;
  }

  async exists(code: string): Promise<boolean> {
    const cached = await this.redisRepository.get(code);
    if (cached) {
      return true;
    }

    const url = await this.urlRepository.findByCode(code);
    return url !== null;
  }

  private async resolveCode(alias?: string): Promise<string> {
    if (alias) {
      if (await this.urlRepository.findByCode(alias)) {
        throw new ConflictError('Alias already in use');
      }
      return alias;
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCode();
      if (!(await this.urlRepository.findByCode(code))) {
        return code;
      }
    }

    throw new ConflictError('Could not generate a unique code');
  }
}
