import { z } from "zod";
import { FileManagerConfig } from "./fileManagerConfig";
import dotenv from "dotenv";
import { log } from "./logger";

if (process.env.NODE_ENV) {
  dotenv.config({ path: `.env` });
  log.info("Loaded .env (local environment)");
}
const s3ReprocessingConfig = FileManagerConfig.and(
  z
    .object({
      AWS_REGION: z.string(),
      AWS_ROLE: z.string().optional(),
      BUCKET_NAME: z.string(),
      QUEUE_URL: z.string(),
      S3_PATH: z.string().optional(),
    })
    .transform((c) => ({
      awsRegion: c.AWS_REGION,
      awsRole: c.AWS_ROLE,
      bucketName: c.BUCKET_NAME,
      queueUrl: c.QUEUE_URL,
      s3Path: c.S3_PATH,
    })),
);

export type S3ReprocessingConfig = z.infer<typeof s3ReprocessingConfig>;

export const config: S3ReprocessingConfig = s3ReprocessingConfig.parse(
  process.env,
);
