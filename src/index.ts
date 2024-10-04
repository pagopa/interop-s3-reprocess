import { S3Client } from "@aws-sdk/client-s3";

import { SQSClient } from "@aws-sdk/client-sqs";
import { config } from "dotenv";
import { log } from "./utilities/logger";
import {
  ProducerService,
  producerServiceBuilder,
} from "./services/producerService";
import { BucketService, bucketServiceBuilder } from "./services/bucketService";
import { reprocessMessage } from "./reprocessMessage";

config({ override: false });

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION,
});

const producerService: ProducerService = producerServiceBuilder(sqsClient);
const bucketService: BucketService = bucketServiceBuilder(s3Client);

async function main(): Promise<void> {
  reprocessMessage(producerService, bucketService);
}

main().catch((error) => {
  log.error("Error in the main execution:", error);
  process.exit(1);
});
