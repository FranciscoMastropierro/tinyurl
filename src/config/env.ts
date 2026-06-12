import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  baseUrl: required('BASE_URL', 'http://localhost:3000'),
  mongoUri: required('MONGO_URI', 'mongodb://localhost:27017/tinyurl'),
  redisUrl: required('REDIS_URL', 'redis://localhost:6379'),
  redisTtlSeconds: Number(process.env.REDIS_TTL_SECONDS ?? 3600),
};
