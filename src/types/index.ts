export interface CreateUrlResult {
  code: string;
  shortUrl: string;
}

export interface UrlStats {
  code: string;
  totalClicks: number;
  lastClick: string | null;
}

export interface UrlListItem {
  code: string;
  originalUrl: string;
  shortUrl: string;
  createdAt: string;
  totalClicks: number;
  lastClick: string | null;
}

export interface ClickJobData {
  code: string;
  clickedAt: string;
  ip?: string;
  userAgent?: string;
}
