import { SQSClient } from '@aws-sdk/client-sqs';
import { env } from '../config/env.js';

let sqsClient: SQSClient | null = null;

export function getSqsClient(): SQSClient {
  if (!sqsClient) {
    sqsClient = new SQSClient({
      region: env.awsRegion,
      ...(env.awsAccessKeyId && env.awsSecretAccessKey
        ? {
            credentials: {
              accessKeyId: env.awsAccessKeyId,
              secretAccessKey: env.awsSecretAccessKey,
            },
          }
        : {}),
    });
  }
  return sqsClient;
}

export function destroySqsClient(): void {
  sqsClient?.destroy();
  sqsClient = null;
}
