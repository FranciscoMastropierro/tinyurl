import type { FastifyReply, FastifyRequest } from 'fastify';
import { enqueueClickEvent } from '../queues/click.queue.js';
import type { UrlService } from '../services/url.service.js';

interface CreateUrlBody {
  url: string;
  alias?: string;
}

interface CodeParams {
  code: string;
}

export function createUrlController(urlService: UrlService) {
  return {
    async create(
      request: FastifyRequest<{ Body: CreateUrlBody }>,
      reply: FastifyReply,
    ) {
      const { url, alias } = request.body;
      const result = await urlService.createUrl(url, alias);
      return reply.status(201).send(result);
    },

    async redirect(
      request: FastifyRequest<{ Params: CodeParams }>,
      reply: FastifyReply,
    ) {
      const { code } = request.params;
      const originalUrl = await urlService.resolveUrl(code);

      void enqueueClickEvent({
        code,
        clickedAt: new Date().toISOString(),
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      }).catch((error) => {
        request.log.error({ err: error, code }, 'Failed to enqueue click event');
      });

      return reply.redirect(originalUrl, 302);
    },
  };
}
