import { S3BodySchema } from "./models/models";
import { log } from "./utilities/logger";
import { ProducerService } from "./services/producerService";
import { BucketService } from "./services/bucketService";
import {
  missingRequiredEnvironmentVariablesError,
  s3NoObjectFoundError,
} from "./utilities/errors";

export async function reprocessMessage(
  producerService: ProducerService,
  bucketService: BucketService,
) {
  const bucketName = process.env.BUCKET_NAME;
  const queueUrl = process.env.QUEUE_URL;
  const s3KeyPath = process.env.S3_PATH;
  const awsRegion = process.env.AWS_REGION;

  if (!bucketName || !queueUrl || !s3KeyPath || !awsRegion) {
    throw missingRequiredEnvironmentVariablesError(
      "Missing required environment variables",
    );
  }

  log.info(`S3 Key Path: ${s3KeyPath} \n`);

  const s3File = await bucketService.getS3Object(bucketName, s3KeyPath);

  if (!s3File) {
    throw s3NoObjectFoundError(`No object found for s3KeyPath ${s3KeyPath}`);
  }

  const s3Body: S3BodySchema = {
    Records: [
      {
        s3: {
          object: {
            key: s3File,
          },
        },
      },
    ],
  };
  await producerService.sendSqsMessage(queueUrl, s3Body);
}
