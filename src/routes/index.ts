import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { StatsController } from '../controllers/stats.controller.js';
import { UrlController } from '../controllers/url.controller.js';
import {
  createUrlSchema,
  redirectParamsSchema,
  statsParamsSchema,
} from '../schemas/url.schema.js';
import type { StatsService } from '../services/stats.service.js';
import type { UrlService } from '../services/url.service.js';

export interface AppServices {
  urlService: UrlService;
  statsService: StatsService;
}

const SHORT_CODE_PATTERN = '[a-zA-Z0-9-_]{1,32}';

export async function registerRoutes(
  app: FastifyInstance,
  services: AppServices,
  publicDir: string,
): Promise<void> {
  const urlController = new UrlController(services.urlService);
  const statsController = new StatsController(services.statsService);

  app.get('/', async (_request, reply) => {
    const html = await readFile(path.join(publicDir, 'index.html'), 'utf-8');
    return reply.type('text/html; charset=utf-8').send(html);
  });

  app.get('/health', async () => ({ status: 'ok' }));

  app.post('/api/urls', { schema: createUrlSchema }, urlController.create);

  app.get('/api/urls', statsController.listAll);

  app.get(
    '/api/stats/:code',
    { schema: statsParamsSchema },
    statsController.getStats,
  );

  app.get(
    `/:code(${SHORT_CODE_PATTERN})`,
    { schema: redirectParamsSchema },
    urlController.redirect,
  );
}
