import { z } from "zod";

const tracingReprocessingConfig = z
  .object({
    AWS_REGION: z.string(),
    AWS_ROLE: z.string(),
    BUCKET_NAME: z.string(),
    QUEUE_URL: z.string(),
    APPLICATION_NAME: z.string(),
  })
  .transform((c) => ({
    awsRegion: c.AWS_REGION,
    awsRole: c.AWS_ROLE,
    bucketName: c.BUCKET_NAME,
    queueUrl: c.QUEUE_URL,
    applicationName: c.APPLICATION_NAME,
  }));

export type TracingReprocessingConfig = z.infer<
  typeof tracingReprocessingConfig
>;

export const config: TracingReprocessingConfig = {
  ...tracingReprocessingConfig.parse(process.env),
};
