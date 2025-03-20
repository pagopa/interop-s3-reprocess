import { S3BodySchema } from "./models/models";
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
  const { bucketName, queueUrl, s3Path: s3KeyPath, awsRegion } = config;
  if (!bucketName || !queueUrl || !awsRegion) {
    throw missingRequiredEnvironmentVariablesError(
      "Missing required environment variables",
    );
  }

  log.info(`S3 Key Path: ${s3KeyPath}`);
  const s3Files = await bucketService.getS3Objects(bucketName, s3KeyPath || ""); // if s3KeyPath not found, reprocess the entire bucket
  if (!s3Files || s3Files.length === 0) {
    throw s3NoObjectFoundError(`No object found for s3KeyPath ${s3KeyPath}`);
  }

  log.info(`Processing ${s3Files.length} items`);
  await Promise.all(
    s3Files.map((s3File) => {
      const s3Body: S3BodySchema = {
        Records: [
          {
            eventName: "ObjectCreated:Put",
            s3: { object: { key: s3File } },
          },
        ],
      };
      return producerService.sendSqsMessage(queueUrl, s3Body);
    }),
  );
}
