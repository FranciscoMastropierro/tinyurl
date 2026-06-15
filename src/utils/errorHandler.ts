import type { FastifyInstance } from 'fastify';
import { AppError } from './errors.js';

export interface ErrorResponseBody {
  error: string;
  message: string;
}

export function mapAppError(error: AppError): {
  statusCode: number;
  body: ErrorResponseBody;
} {
  return {
    statusCode: error.statusCode,
    body: { error: error.code, message: error.message },
  };
}

export function mapValidationError(error: unknown): {
  statusCode: number;
  body: ErrorResponseBody;
} {
  const message = error instanceof Error ? error.message : 'Validation failed';
  return {
    statusCode: 400,
    body: { error: 'VALIDATION_ERROR', message },
  };
}

export function isValidationError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'validation' in error &&
    Boolean((error as { validation?: unknown }).validation)
  );
}

export function isClientError(error: unknown): error is Error & { statusCode: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof (error as { statusCode: unknown }).statusCode === 'number' &&
    (error as { statusCode: number }).statusCode >= 400 &&
    (error as { statusCode: number }).statusCode < 500
  );
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      const { statusCode, body } = mapAppError(error);
      return reply.status(statusCode).send(body);
    }

    if (isValidationError(error)) {
      const { statusCode, body } = mapValidationError(error);
      return reply.status(statusCode).send(body);
    }

    if (isClientError(error)) {
      const message = error instanceof Error ? error.message : 'Bad request';
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
}
