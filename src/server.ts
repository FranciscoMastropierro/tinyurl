import mongoose from 'mongoose';
import { env } from './config/env.js';
import { buildApp } from './app.js';
import { closeClickQueue } from './queues/click.queue.js';
import { createRedisClient, RedisRepository } from './repositories/redis.repository.js';
import { UrlRepository } from './repositories/url.repository.js';
import { ClickRepository } from './repositories/click.repository.js';
import { UrlService } from './services/url.service.js';
import { StatsService } from './services/stats.service.js';

async function start(): Promise<void> {
  await mongoose.connect(env.mongoUri);

  const redisClient = createRedisClient();
  const redisRepository = new RedisRepository(redisClient);
  const urlRepository = new UrlRepository();
  const clickRepository = new ClickRepository();

  const urlService = new UrlService(urlRepository, redisRepository);
  const statsService = new StatsService(urlRepository, clickRepository);

  const app = await buildApp({ urlService, statsService });

  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}, shutting down`);
    await app.close();
    await closeClickQueue();
    await redisRepository.close();
    await mongoose.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await app.listen({ port: env.port, host: '0.0.0.0' });
  app.log.info(`Server listening on ${env.baseUrl}`);
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
