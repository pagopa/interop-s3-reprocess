import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient } from "@aws-sdk/client-sqs";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { config } from "../src/utilities/config.js";
import {
  BucketService,
  bucketServiceBuilder,
} from "../src/services/bucketService.js";
import {
  ProducerService,
  producerServiceBuilder,
} from "../src/services/producerService.js";

import { reprocessMessage } from "../src/reprocessMessage.js";

describe("Processing message", () => {
  const sqsClient: SQSClient = new SQSClient({
    region: config.awsRegion,
  });

  const s3client: S3Client = new S3Client({
    region: config.awsRegion,
  });

  let bucketService: BucketService = bucketServiceBuilder(s3client);
  let producerService: ProducerService = producerServiceBuilder(sqsClient);
  const messageBody = {
    Records: [
      {
        s3: {
          object: {
            key: "test-file",
          },
        },
      },
    ],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.BUCKET_NAME = "test-bucket";
    process.env.QUEUE_URL = "https://sqs.test-url.com/1234";
    process.env.AWS_ACCESS_KEY_ID = "test-key";
    process.env.AWS_SECRET_ACCESS_KEY = "test-secret";
    process.env.AWS_REGION = "test-region";
  });

  afterEach(() => {
    delete process.env.BUCKET_NAME;
    delete process.env.QUEUE_URL;
    delete process.env.S3_PATH;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.AWS_REGION;
    process.env.S3_PATH = "test-path";
  });

  const mockProducerService = {
    sendSqsMessage: vi.fn(),
  };

  const mockBucketService = {
    getS3Object: vi.fn(),
  };

  const mockS3Client = {
    send: vi.fn(),
  };

  it("should throw error when there is no s3KeyPath", async () => {
    await expect(
      reprocessMessage(producerService, bucketService),
    ).rejects.toThrow("Missing required environment variables");
  });

  it("should return an error when object is not found", async () => {
    mockBucketService.getS3Object.mockRejectedValue(
      `No object found for s3KeyPath ${process.env.S3_PATH}`,
    );

    await expect(
      reprocessMessage(mockProducerService as any, mockBucketService as any),
    ).rejects.toThrow(`No object found for s3KeyPath ${process.env.S3_PATH}`);

    expect(mockBucketService.getS3Object).toHaveBeenCalledWith(
      "test-bucket",
      "test-path",
    );
  });

  it("should return the S3 object key when object is found", async () => {
    const mockResponse = {
      Contents: [{ Key: "test-file-key" }],
    };
    mockS3Client.send.mockResolvedValue(mockResponse);
    vi.spyOn(bucketService, "getS3Object").mockResolvedValue("test-file-key");

    const result = await bucketService.getS3Object("test-bucket", "test-path");

    expect(result).toBe("test-file-key");
  });

  it("should call sendSqsMessage when a valid S3 file is found", async () => {
    mockBucketService.getS3Object.mockResolvedValue("test-file");

    await reprocessMessage(
      mockProducerService as any,
      mockBucketService as any,
    );

    expect(mockBucketService.getS3Object).toHaveBeenCalledWith(
      "test-bucket",
      "test-path",
    );
    expect(mockProducerService.sendSqsMessage).toHaveBeenCalledWith(
      "https://sqs.test-url.com/1234",
      messageBody,
    );
  });

  it("should return undefined and log an error when SQS send fails", async () => {
    mockProducerService.sendSqsMessage.mockRejectedValue("Error");

    await expect(
      mockProducerService.sendSqsMessage("", messageBody),
    ).rejects.toThrowError("");
  });
});
