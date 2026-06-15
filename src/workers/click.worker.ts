import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
} from '@aws-sdk/client-sqs';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { destroySqsClient, getSqsClient } from '../queues/sqs.client.js';
import { ClickRepository } from '../repositories/click.repository.js';
import type { ClickJobData } from '../types/index.js';

const WAIT_TIME_SECONDS = 20;
const POLL_ERROR_DELAY_MS = 5000;

let running = true;

async function processMessage(
  body: string,
  clickRepository: ClickRepository,
): Promise<void> {
  const data = JSON.parse(body) as ClickJobData;
  await clickRepository.create({
    code: data.code,
    clickedAt: new Date(data.clickedAt),
    ip: data.ip,
    userAgent: data.userAgent,
  });
}

async function poll(clickRepository: ClickRepository): Promise<void> {
  const response = await getSqsClient().send(
    new ReceiveMessageCommand({
      QueueUrl: env.sqsQueueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: WAIT_TIME_SECONDS,
    }),
  );

  for (const message of response.Messages ?? []) {
    if (!message.Body || !message.ReceiptHandle) {
      continue;
    }

    try {
      await processMessage(message.Body, clickRepository);
      await getSqsClient().send(
        new DeleteMessageCommand({
          QueueUrl: env.sqsQueueUrl,
          ReceiptHandle: message.ReceiptHandle,
        }),
      );
    } catch (error) {
      console.error('Failed to process click message:', error);
    }
  }
}

async function startWorker(): Promise<void> {
  await mongoose.connect(env.mongoUri);

  const clickRepository = new ClickRepository();

  const shutdown = () => {
    running = false;
    console.log('Click worker shutting down...');
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  console.log('Click worker started (SQS)');

  while (running) {
    try {
      await poll(clickRepository);
    } catch (error) {
      console.error('SQS poll error:', error);
      if (running) {
        await new Promise((resolve) => setTimeout(resolve, POLL_ERROR_DELAY_MS));
      }
    }
  }

  destroySqsClient();
  await mongoose.disconnect();
  process.exit(0);
}

startWorker().catch((error) => {
  console.error('Failed to start click worker:', error);
  process.exit(1);
});
