import { customAlphabet } from 'nanoid';
import { env } from '../config/env.js';
import { enqueueClickEvent } from '../queues/click.queue.js';
import { UrlRepository } from '../repositories/url.repository.js';
import type { ClickMetadata } from '../types/domain/click.types.js';
import type { CreateUrlResult } from '../types/domain/url.types.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';
import { isDuplicateKeyError } from '../utils/mongo.js';
import type { UrlCache } from '../utils/url-cache.js';

const generateCode = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  7,
);

const MAX_CODE_ATTEMPTS = 5;

export interface ServiceLogger {
  error(payload: Record<string, unknown>, message: string): void;
}

export class UrlService {
  constructor(
    private readonly urlRepository: UrlRepository,
    private readonly urlCache: UrlCache,
    private readonly log: ServiceLogger = {
      error: (payload, message) => console.error(message, payload),
    },
  ) {}

  async createUrl(originalUrl: string, alias?: string): Promise<CreateUrlResult> {
    if (alias) {
      if (await this.urlRepository.findByCode(alias)) {
        throw new ConflictError('Alias already in use');
      }
      return this.persistUrl(alias, originalUrl);
    }

    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      const code = generateCode();
      try {
        return await this.persistUrl(code, originalUrl);
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          continue;
        }
        throw error;
      }
    }

    throw new ConflictError('Could not generate a unique code');
  }

  async resolveUrl(code: string): Promise<string> {
    const cached = await this.urlCache.get(code);
    if (cached) {
      return cached;
    }

    const url = await this.urlRepository.findByCode(code);
    if (!url) {
      throw new NotFoundError('URL not found');
    }

    await this.urlCache.set(code, url.originalUrl);
    return url.originalUrl;
  }

  async handleRedirect(code: string, metadata: ClickMetadata): Promise<string> {
    const originalUrl = await this.resolveUrl(code);

    void this.recordClick(code, metadata).catch((error) => {
      this.log.error({ err: error, code }, 'Failed to enqueue click event');
    });

    return originalUrl;
  }

  async exists(code: string): Promise<boolean> {
    const cached = await this.urlCache.get(code);
    if (cached) {
      return true;
    }

    const url = await this.urlRepository.findByCode(code);
    return url !== null;
  }

  private async persistUrl(
    code: string,
    originalUrl: string,
  ): Promise<CreateUrlResult> {
    const url = await this.urlRepository.create({ code, originalUrl });
    await this.urlCache.set(code, originalUrl);

    return {
      code: url.code,
      shortUrl: `${env.baseUrl}/${url.code}`,
    };
  }

  private async recordClick(
    code: string,
    metadata: ClickMetadata,
  ): Promise<void> {
    await enqueueClickEvent({
      code,
      clickedAt: new Date().toISOString(),
      ...metadata,
    });
  }
}
