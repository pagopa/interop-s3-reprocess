import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/utilities/config", () => ({
  config: {
    bucketName: "test-bucket",
    queueUrl: "https://sqs.test-url.com/1234",
    s3Path: "test-path",
    awsRegion: "test-region",
    s3Server: "",
  },
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation(() => ({ send: vi.fn() })),
  ListObjectsV2Command: vi.fn(),
}));

vi.mock("@aws-sdk/client-sqs", () => ({
  SQSClient: vi.fn().mockImplementation(() => ({ send: vi.fn() })),
  SendMessageCommand: vi.fn(),
  SendMessageBatchCommand: vi.fn(),
}));

import { reprocessMessage } from "../src/reprocessMessage";
import { bucketServiceBuilder } from "../src/services/bucketService";
import { producerServiceBuilder } from "../src/services/producerService";
import { config } from "../src/utilities/config";

describe("reprocessMessage tests", () => {
  const s3ClientMock = { send: vi.fn() };
  const sqsClientMock = { send: vi.fn() };
  const bucketService = bucketServiceBuilder(s3ClientMock as any);
  const producerService = producerServiceBuilder(sqsClientMock as any);

  beforeEach(() => {
    vi.resetAllMocks();
    config.bucketName = "test-bucket";
    config.queueUrl = "https://sqs.test-url.com/1234";
    config.s3Path = "test-path";
    config.awsRegion = "test-region";
    config.startFrom = 0;
  });

  it("throw errors if object is not found", async () => {
    vi.spyOn(bucketService, "getS3Objects").mockResolvedValue([]);
    await expect(
      reprocessMessage(producerService, bucketService),
    ).rejects.toThrow(`No object found for s3KeyPath test-path`);
  });

  it("calls sendSqsMessageBatch for one file", async () => {
    const batchSpy = vi
      .spyOn(producerService, "sendSqsMessageBatch")
      .mockResolvedValue({} as any);
    vi.spyOn(bucketService, "getS3Objects").mockResolvedValue(["single-file"]);
    await reprocessMessage(producerService, bucketService);
    expect(batchSpy).toHaveBeenCalledTimes(1);
    expect(batchSpy).toHaveBeenCalledWith("https://sqs.test-url.com/1234", [
      {
        id: "msg_0",
        body: {
          Records: [
            {
              eventName: "ObjectCreated:Put",
              s3: { object: { key: "single-file" } },
            },
          ],
        },
      },
    ]);
  });

  it("calls sendSqsMessageBatch with correct chunking", async () => {
    const batchSpy = vi
      .spyOn(producerService, "sendSqsMessageBatch")
      .mockResolvedValue({} as any);
    const files = Array.from({ length: 15 }, (_, i) => `file-${i}`);
    vi.spyOn(bucketService, "getS3Objects").mockResolvedValue(files);
    await reprocessMessage(producerService, bucketService);
    expect(batchSpy).toHaveBeenCalledTimes(2);
    const firstCallArgs = batchSpy.mock.calls[0][1];
    expect(firstCallArgs).toHaveLength(10);
    expect(firstCallArgs[0].body.Records[0].s3.object.key).toBe("file-0");
    const secondCallArgs = batchSpy.mock.calls[1][1];
    expect(secondCallArgs).toHaveLength(5);
    expect(secondCallArgs[0].body.Records[0].s3.object.key).toBe("file-10");
  });
});
