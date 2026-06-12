import mongoose from 'mongoose';
import { Worker } from 'bullmq';
import { env } from '../config/env.js';
import { CLICK_QUEUE_NAME } from '../queues/click.queue.js';
import { ClickRepository } from '../repositories/click.repository.js';
import type { ClickJobData } from '../types/index.js';

async function startWorker(): Promise<void> {
  await mongoose.connect(env.mongoUri);

  const clickRepository = new ClickRepository();

  const worker = new Worker<ClickJobData>(
    CLICK_QUEUE_NAME,
    async (job) => {
      const { code, clickedAt, ip, userAgent } = job.data;
      await clickRepository.create({
        code,
        clickedAt: new Date(clickedAt),
        ip,
        userAgent,
      });
    },
    { connection: { url: env.redisUrl } },
  );

  worker.on('failed', (job, error) => {
    console.error(`Click job ${job?.id} failed:`, error);
  });

  console.log('Click worker started');
}

startWorker().catch((error) => {
  console.error('Failed to start click worker:', error);
  process.exit(1);
});
