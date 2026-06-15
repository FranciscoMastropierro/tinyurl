import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify, { type FastifyInstance } from 'fastify';
import { registerRoutes, type AppServices } from './routes/index.js';
import { registerErrorHandler } from './utils/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

export async function buildApp(services: AppServices): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  registerErrorHandler(app);
  await registerRoutes(app, services, publicDir);

  return app;
}
