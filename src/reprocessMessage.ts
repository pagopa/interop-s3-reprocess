import { SendMessageBatchCommandOutput } from "@aws-sdk/client-sqs";
import { log } from "./utilities/logger";
import { ProducerService } from "./services/producerService";
import { BucketService } from "./services/bucketService";
import {
  missingRequiredEnvironmentVariablesError,
  s3NoObjectFoundError,
} from "./utilities/errors";
import { config } from "./utilities/config";

export async function reprocessMessage(
  producerService: ProducerService,
  bucketService: BucketService,
) {
  const {
    bucketName,
    queueUrl,
    s3Path: s3KeyPath,
    awsRegion,
    startFrom,
  } = config;
  if (!bucketName || !queueUrl || !awsRegion) {
    throw missingRequiredEnvironmentVariablesError(
      "Missing required environment variables",
    );
  }

  log.info(`S3 Key Path: ${s3KeyPath}`);
  const s3Files = await bucketService.getS3Objects(bucketName, s3KeyPath || "");
  if (!s3Files || s3Files.length === 0) {
    throw s3NoObjectFoundError(`No object found for s3KeyPath ${s3KeyPath}`);
  }

  log.info(`Processing ${s3Files.length} items`);
  log.info(`Starting from offset ${startFrom}`);

  const BATCH_SIZE = 10;
  const CONCURRENT_BATCHES = 30;
  for (
    let i = startFrom;
    i < s3Files.length;
    i += BATCH_SIZE * CONCURRENT_BATCHES
  ) {
    const currentChunk = s3Files.slice(i, i + BATCH_SIZE * CONCURRENT_BATCHES);
    const batchPromises: Array<Promise<SendMessageBatchCommandOutput>> = [];

    for (let j = 0; j < currentChunk.length; j += BATCH_SIZE) {
      const batch = currentChunk.slice(j, j + BATCH_SIZE);
      const entries = batch.map((s3File, index) => ({
        id: `msg_${i + j + index}`,
        body: {
          Records: [
            {
              eventName: "ObjectCreated:Put",
              s3: { object: { key: s3File } },
            },
          ],
        },
      }));

      batchPromises.push(
        producerService.sendSqsMessageBatch(queueUrl, entries),
      );
    }

    await Promise.all(batchPromises);
    log.info(
      `Progress: ${Math.min(i + currentChunk.length, s3Files.length)}/${s3Files.length}`,
    );
  }
}
