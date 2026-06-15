import { describe, expect, it } from 'vitest';
import { AppError, ConflictError, NotFoundError } from '../../utils/errors.js';
import {
  isClientError,
  isValidationError,
  mapAppError,
  mapValidationError,
} from '../../utils/errorHandler.js';

describe('errorHandler mappers', () => {
  it('maps AppError to status and body', () => {
    const error = new NotFoundError('URL not found');
    expect(mapAppError(error)).toEqual({
      statusCode: 404,
      body: { error: 'NOT_FOUND', message: 'URL not found' },
    });
  });

  it('maps validation errors to 400', () => {
    const result = mapValidationError(new Error('Invalid url'));
    expect(result.statusCode).toBe(400);
    expect(result.body.error).toBe('VALIDATION_ERROR');
  });

  it('detects validation errors', () => {
    expect(isValidationError({ validation: [{ message: 'bad' }] })).toBe(true);
    expect(isValidationError(new Error('nope'))).toBe(false);
  });

  it('detects client errors', () => {
    const error = Object.assign(new Error('Bad'), { statusCode: 400 });
    expect(isClientError(error)).toBe(true);
    expect(isClientError(new AppError(500, 'x', 'X'))).toBe(false);
  });

  it('ConflictError uses 409', () => {
    const error = new ConflictError('Alias already in use');
    expect(mapAppError(error).statusCode).toBe(409);
  });
});
