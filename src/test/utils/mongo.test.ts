import { describe, expect, it } from 'vitest';
import { isDuplicateKeyError } from '../../utils/mongo.js';

describe('isDuplicateKeyError', () => {
  it('returns true for MongoDB duplicate key (11000)', () => {
    expect(isDuplicateKeyError({ code: 11000 })).toBe(true);
  });

  it('returns false for other errors', () => {
    expect(isDuplicateKeyError(new Error('fail'))).toBe(false);
    expect(isDuplicateKeyError({ code: 11001 })).toBe(false);
    expect(isDuplicateKeyError(null)).toBe(false);
  });
});
