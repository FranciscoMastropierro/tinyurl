import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../config/env.js', () => ({
  env: { baseUrl: 'http://localhost:3000' },
}));

vi.mock('../../queues/click.queue.js', () => ({
  enqueueClickEvent: vi.fn().mockResolvedValue(undefined),
}));

import { UrlService } from '../../services/url.service.js';
import { enqueueClickEvent } from '../../queues/click.queue.js';
import { ConflictError, NotFoundError } from '../../utils/errors.js';
import {
  createMockUrlCache,
  createMockUrlRepository,
} from '../mocks/repositories.mock.js';

describe('UrlService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates URL without alias', async () => {
    const urlRepository = createMockUrlRepository({
      create: vi.fn().mockResolvedValue({ code: 'abc1234', originalUrl: 'https://a.com' }),
    });
    const urlCache = createMockUrlCache();

    const service = new UrlService(urlRepository, urlCache);
    const result = await service.createUrl('https://a.com');

    expect(result.code).toHaveLength(7);
    expect(result.shortUrl).toBe(`http://localhost:3000/${result.code}`);
    expect(urlCache.set).toHaveBeenCalledOnce();
  });

  it('creates URL with alias', async () => {
    const urlRepository = createMockUrlRepository({
      findByCode: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ code: 'myalias', originalUrl: 'https://a.com' }),
    });
    const urlCache = createMockUrlCache();

    const service = new UrlService(urlRepository, urlCache);
    const result = await service.createUrl('https://a.com', 'myalias');

    expect(result).toEqual({
      code: 'myalias',
      shortUrl: 'http://localhost:3000/myalias',
    });
  });

  it('throws ConflictError when alias is in use', async () => {
    const urlRepository = createMockUrlRepository({
      findByCode: vi.fn().mockResolvedValue({ code: 'taken' }),
    });

    const service = new UrlService(urlRepository, createMockUrlCache());

    await expect(service.createUrl('https://a.com', 'taken')).rejects.toThrow(
      ConflictError,
    );
  });

  it('retries on duplicate key when generating random code', async () => {
    const duplicateError = { code: 11000 };
    const urlRepository = createMockUrlRepository({
      create: vi
        .fn()
        .mockRejectedValueOnce(duplicateError)
        .mockResolvedValueOnce({ code: 'xyz9876', originalUrl: 'https://a.com' }),
    });

    const service = new UrlService(urlRepository, createMockUrlCache());
    const result = await service.createUrl('https://a.com');

    expect(result.code).toHaveLength(7);
    expect(urlRepository.create).toHaveBeenCalledTimes(2);
  });

  it('throws ConflictError after max duplicate key attempts', async () => {
    const duplicateError = { code: 11000 };
    const urlRepository = createMockUrlRepository({
      create: vi.fn().mockRejectedValue(duplicateError),
    });

    const service = new UrlService(urlRepository, createMockUrlCache());

    await expect(service.createUrl('https://a.com')).rejects.toThrow(ConflictError);
    expect(urlRepository.create).toHaveBeenCalledTimes(5);
  });

  it('resolveUrl returns cached value without hitting DB', async () => {
    const urlRepository = createMockUrlRepository();
    const urlCache = createMockUrlCache({
      get: vi.fn().mockResolvedValue('https://cached.com'),
    });

    const service = new UrlService(urlRepository, urlCache);
    const url = await service.resolveUrl('abc');

    expect(url).toBe('https://cached.com');
    expect(urlRepository.findByCode).not.toHaveBeenCalled();
  });

  it('resolveUrl loads from DB and repopulates cache on miss', async () => {
    const urlRepository = createMockUrlRepository({
      findByCode: vi.fn().mockResolvedValue({
        code: 'abc',
        originalUrl: 'https://db.com',
      }),
    });
    const urlCache = createMockUrlCache({
      get: vi.fn().mockResolvedValue(null),
    });

    const service = new UrlService(urlRepository, urlCache);
    const url = await service.resolveUrl('abc');

    expect(url).toBe('https://db.com');
    expect(urlCache.set).toHaveBeenCalledWith('abc', 'https://db.com');
  });

  it('resolveUrl throws NotFoundError for unknown code', async () => {
    const urlRepository = createMockUrlRepository({
      findByCode: vi.fn().mockResolvedValue(null),
    });
    const urlCache = createMockUrlCache({
      get: vi.fn().mockResolvedValue(null),
    });

    const service = new UrlService(urlRepository, urlCache);

    await expect(service.resolveUrl('missing')).rejects.toThrow(NotFoundError);
  });

  it('handleRedirect enqueues click event', async () => {
    const urlRepository = createMockUrlRepository({
      findByCode: vi.fn().mockResolvedValue({
        code: 'abc',
        originalUrl: 'https://target.com',
      }),
    });
    const urlCache = createMockUrlCache({
      get: vi.fn().mockResolvedValue(null),
    });

    const service = new UrlService(urlRepository, urlCache);
    const url = await service.handleRedirect('abc', {
      ip: '127.0.0.1',
      userAgent: 'test',
    });

    expect(url).toBe('https://target.com');
    expect(enqueueClickEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'abc',
        ip: '127.0.0.1',
        userAgent: 'test',
      }),
    );
  });
});
