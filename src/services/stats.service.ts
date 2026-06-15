import { env } from '../config/env.js';
import { ClickRepository } from '../repositories/click.repository.js';
import { UrlRepository } from '../repositories/url.repository.js';
import type { UrlListItem, UrlStats } from '../types/domain/url.types.js';
import { NotFoundError } from '../utils/errors.js';

export class StatsService {
  constructor(
    private readonly urlRepository: UrlRepository,
    private readonly clickRepository: ClickRepository,
  ) {}

  async getStats(code: string): Promise<UrlStats> {
    const url = await this.urlRepository.findByCode(code);
    if (!url) {
      throw new NotFoundError('URL not found');
    }

    const totalClicks = await this.clickRepository.countByCode(code);
    const lastClickDoc = await this.clickRepository.findLastByCode(code);

    return {
      code,
      totalClicks,
      lastClick: lastClickDoc?.clickedAt.toISOString() ?? null,
    };
  }

  async listUrlsWithStats(): Promise<UrlListItem[]> {
    const urls = await this.urlRepository.findAll();

    return Promise.all(
      urls.map(async (url) => {
        const totalClicks = await this.clickRepository.countByCode(url.code);
        const lastClickDoc = await this.clickRepository.findLastByCode(url.code);

        return {
          code: url.code,
          originalUrl: url.originalUrl,
          shortUrl: `${env.baseUrl}/${url.code}`,
          createdAt: url.createdAt.toISOString(),
          totalClicks,
          lastClick: lastClickDoc?.clickedAt.toISOString() ?? null,
        };
      }),
    );
  }
}
