export const createUrlSchema = {
  body: {
    type: 'object',
    required: ['url'],
    additionalProperties: false,
    properties: {
      url: {
        type: 'string',
        minLength: 1,
        pattern: '^https?://',
      },
      alias: {
        type: 'string',
        minLength: 3,
        maxLength: 32,
        pattern: '^[a-zA-Z0-9-_]+$',
      },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        shortUrl: { type: 'string' },
      },
    },
  },
} as const;

export const statsParamsSchema = {
  params: {
    type: 'object',
    required: ['code'],
    properties: {
      code: { type: 'string', minLength: 1 },
    },
  },
} as const;

export const redirectParamsSchema = {
  params: {
    type: 'object',
    required: ['code'],
    properties: {
      code: {
        type: 'string',
        minLength: 1,
        maxLength: 32,
        pattern: '^[a-zA-Z0-9-_]+$',
      },
    },
  },
} as const;
