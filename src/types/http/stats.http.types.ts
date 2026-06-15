import type { UrlListItem, UrlStats } from '../domain/url.types.js';

export type StatsParamsRequest = {
  Params: { code: string };
};

export type GetStatsResponse = UrlStats;

export type ListUrlsResponse = UrlListItem[];
