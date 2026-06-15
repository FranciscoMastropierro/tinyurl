import type { CreateUrlResult } from '../domain/url.types.js';

export interface CreateUrlBody {
  url: string;
  alias?: string;
}

export type CreateUrlRequest = {
  Body: CreateUrlBody;
};

export type RedirectRequest = {
  Params: { code: string };
};

export type CreateUrlResponse = CreateUrlResult;
