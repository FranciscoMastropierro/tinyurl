import { vi } from 'vitest';
import type { ClickRepository } from '../../repositories/click.repository.js';
import type { UrlRepository } from '../../repositories/url.repository.js';
import type { UrlCache } from '../../utils/url-cache.js';

export function createMockUrlRepository(
  overrides: Partial<UrlRepository> = {},
): UrlRepository {
  return {
    create: vi.fn(),
    findByCode: vi.fn(),
    findAll: vi.fn(),
    ...overrides,
  } as unknown as UrlRepository;
}

export function createMockClickRepository(
  overrides: Partial<ClickRepository> = {},
): ClickRepository {
  return {
    create: vi.fn(),
    countByCode: vi.fn(),
    findLastByCode: vi.fn(),
    ...overrides,
  } as unknown as ClickRepository;
}

export function createMockUrlCache(
  overrides: Partial<UrlCache> = {},
): UrlCache {
  return {
    get: vi.fn(),
    set: vi.fn(),
    close: vi.fn(),
    ...overrides,
  } as unknown as UrlCache;
}
