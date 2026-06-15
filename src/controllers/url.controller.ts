import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UrlService } from '../services/url.service.js';
import type {
  CreateUrlRequest,
  RedirectRequest,
} from '../types/http/url.http.types.js';

export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  create = async (
    request: FastifyRequest<CreateUrlRequest>,
    reply: FastifyReply,
  ) => {
    const { url, alias } = request.body;
    const result = await this.urlService.createUrl(url, alias);
    return reply.status(201).send(result);
  };

  redirect = async (
    request: FastifyRequest<RedirectRequest>,
    reply: FastifyReply,
  ) => {
    const { code } = request.params;
    const originalUrl = await this.urlService.handleRedirect(code, {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.redirect(originalUrl, 302);
  };
}
