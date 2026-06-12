import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify, { type FastifyInstance } from 'fastify';
import { registerRoutes, type AppServices } from './routes/index.js';
import { AppError } from './utils/errors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

export async function buildApp(services: AppServices): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.code,
        message: error.message,
      });
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'validation' in error &&
      error.validation
    ) {
      const message =
        error instanceof Error ? error.message : 'Validation failed';
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message,
      });
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof error.statusCode === 'number' &&
      error.statusCode >= 400 &&
      error.statusCode < 500
    ) {
      const message =
        error instanceof Error ? error.message : 'Bad request';
      return reply.status(error.statusCode).send({
        error: 'BAD_REQUEST',
        message,
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      error: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  });

  await registerRoutes(app, services, publicDir);

  return app;
}
