import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../config/env.js', () => ({
  env: { baseUrl: 'http://localhost:3000' },
}));

import { StatsService } from '../../services/stats.service.js';
import { NotFoundError } from '../../utils/errors.js';
import {
  createMockClickRepository,
  createMockUrlRepository,
} from '../mocks/repositories.mock.js';

describe('StatsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns stats for existing URL', async () => {
    const clickedAt = new Date('2026-01-01T12:00:00.000Z');
    const urlRepository = createMockUrlRepository({
      findByCode: vi.fn().mockResolvedValue({
        code: 'abc',
        originalUrl: 'https://a.com',
        createdAt: new Date(),
      }),
    });
    const clickRepository = createMockClickRepository({
      countByCode: vi.fn().mockResolvedValue(3),
      findLastByCode: vi.fn().mockResolvedValue({ clickedAt }),
    });

    const service = new StatsService(urlRepository, clickRepository);
    const stats = await service.getStats('abc');

    expect(stats).toEqual({
      code: 'abc',
      totalClicks: 3,
      lastClick: clickedAt.toISOString(),
    });
  });

  it('throws NotFoundError when URL does not exist', async () => {
    const urlRepository = createMockUrlRepository({
      findByCode: vi.fn().mockResolvedValue(null),
    });

    const service = new StatsService(urlRepository, createMockClickRepository());

    await expect(service.getStats('missing')).rejects.toThrow(NotFoundError);
  });

  it('lists URLs with aggregated stats', async () => {
    const createdAt = new Date('2026-01-01T10:00:00.000Z');
    const urlRepository = createMockUrlRepository({
      findAll: vi.fn().mockResolvedValue([
        { code: 'a', originalUrl: 'https://a.com', createdAt },
      ]),
    });
    const clickRepository = createMockClickRepository({
      countByCode: vi.fn().mockResolvedValue(2),
      findLastByCode: vi.fn().mockResolvedValue(null),
    });

    const service = new StatsService(urlRepository, clickRepository);
    const list = await service.listUrlsWithStats();

    expect(list).toEqual([
      {
        code: 'a',
        originalUrl: 'https://a.com',
        shortUrl: 'http://localhost:3000/a',
        createdAt: createdAt.toISOString(),
        totalClicks: 2,
        lastClick: null,
      },
    ]);
  });
});
