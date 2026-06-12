import { ClickRepository } from '../repositories/click.repository.js';
import { UrlRepository } from '../repositories/url.repository.js';
import type { UrlStats } from '../types/index.js';
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
}
