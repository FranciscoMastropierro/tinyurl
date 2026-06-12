import { Queue } from 'bullmq';
import { env } from '../config/env.js';
import type { ClickJobData } from '../types/index.js';

export const CLICK_QUEUE_NAME = 'click-events';

let clickQueue: Queue<ClickJobData> | null = null;

export function getClickQueue(): Queue<ClickJobData> {
  if (!clickQueue) {
    clickQueue = new Queue<ClickJobData>(CLICK_QUEUE_NAME, {
      connection: { url: env.redisUrl },
    });
  }
  return clickQueue;
}

export async function enqueueClickEvent(data: ClickJobData): Promise<void> {
  await getClickQueue().add('click', data);
}

export async function closeClickQueue(): Promise<void> {
  if (clickQueue) {
    await clickQueue.close();
    clickQueue = null;
  }
}
