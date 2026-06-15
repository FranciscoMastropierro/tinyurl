import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { env } from '../config/env.js';
import type { ClickJobData } from '../types/index.js';
import { destroySqsClient, getSqsClient } from './sqs.client.js';

export async function enqueueClickEvent(data: ClickJobData): Promise<void> {
  await getSqsClient().send(
    new SendMessageCommand({
      QueueUrl: env.sqsQueueUrl,
      MessageBody: JSON.stringify(data),
    }),
  );
}

export async function closeClickQueue(): Promise<void> {
  destroySqsClient();
}
