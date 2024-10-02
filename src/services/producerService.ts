import {
  SendMessageCommandOutput,
  SendMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { log } from "../utilities/logger";
import { S3BodySchema } from "../models/models";
import { sqsSendMessageError } from "../utilities/errors";

export const producerServiceBuilder = (sqsClient: SQSClient) => {
  return {
    async sendSqsMessage(
      queueUrl: string,
      messageBody: S3BodySchema,
    ): Promise<SendMessageCommandOutput> {
      try {
        const command: SendMessageCommand = new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify(messageBody),
        });
        const response: SendMessageCommandOutput =
          await sqsClient.send(command);
        log.info(`Message sent with ID: ${response.MessageId}`);
        return response;
      } catch (error) {
        log.error(`Error sending message`, error);
        throw sqsSendMessageError(error);
      }
    },
  };
};
export type ProducerService = ReturnType<typeof producerServiceBuilder>;
