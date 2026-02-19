import {
  SendMessageBatchCommand,
  SendMessageBatchCommandOutput,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { log } from "../utilities/logger";
import { S3BodySchema } from "../models/models";
import { sqsSendMessageError } from "../utilities/errors";

export const producerServiceBuilder = (sqsClient: SQSClient) => {
  return {
    async sendSqsMessageBatch(
      queueUrl: string,
      entries: Array<{ id: string; body: S3BodySchema }>,
    ): Promise<SendMessageBatchCommandOutput> {
      try {
        const command = new SendMessageBatchCommand({
          QueueUrl: queueUrl,
          Entries: entries.map((entry) => ({
            Id: entry.id,
            MessageBody: JSON.stringify(entry.body),
          })),
        });
        return await sqsClient.send(command);
      } catch (error) {
        log.error(`Error sending message batch`, error);
        throw sqsSendMessageError(error);
      }
    },
  };
};

export type ProducerService = ReturnType<typeof producerServiceBuilder>;
