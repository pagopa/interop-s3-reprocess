import { S3Client } from "@aws-sdk/client-s3";

import { SQSClient } from "@aws-sdk/client-sqs";
import { log } from "./utilities/logger";
import {
  ProducerService,
  producerServiceBuilder,
} from "./services/producerService";
import { BucketService, bucketServiceBuilder } from "./services/bucketService";
import { reprocessMessage } from "./reprocessMessage";
import { config } from "./utilities/config";

const s3Client = new S3Client({
  region: config.awsRegion,
  endpoint: config.s3Server,
  forcePathStyle: true,
});

const sqsClient = new SQSClient(config);

const producerService: ProducerService = producerServiceBuilder(sqsClient);
const bucketService: BucketService = bucketServiceBuilder(s3Client);

async function main(): Promise<void> {
  reprocessMessage(producerService, bucketService);
}

main().catch((error) => {
  log.error("Error in the main execution:", error);
  process.exit(1);
});
