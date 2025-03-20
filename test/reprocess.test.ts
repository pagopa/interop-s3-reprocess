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
  });

  it("throws error if s3Path is missing", async () => {
    config.s3Path = undefined as any;
    await expect(
      reprocessMessage(producerService, bucketService),
    ).rejects.toThrow("Missing required environment variables");
  });

  it("throw errors if object is not found", async () => {
    vi.spyOn(bucketService, "getS3Objects").mockResolvedValue([]);
    await expect(
      reprocessMessage(producerService, bucketService),
    ).rejects.toThrow(`No object found for s3KeyPath test-path`);
  });

  it("calls sendSqsMessage for one file", async () => {
    const sendSpy = vi
      .spyOn(producerService, "sendSqsMessage")
      .mockResolvedValue({} as any);
    vi.spyOn(bucketService, "getS3Objects").mockResolvedValue(["single-file"]);

    await reprocessMessage(producerService, bucketService);

    expect(sendSpy).toHaveBeenCalledTimes(1);
    expect(sendSpy).toHaveBeenCalledWith("https://sqs.test-url.com/1234", {
      Records: [
        {
          s3: { object: { key: "single-file" } },
        },
      ],
    });
  });

  it("calls sendSqsMessage n times if multiple files found", async () => {
    const sendSpy = vi
      .spyOn(producerService, "sendSqsMessage")
      .mockResolvedValue({} as any);
    vi.spyOn(bucketService, "getS3Objects").mockResolvedValue([
      "fileA",
      "fileB",
      "fileC",
    ]);

    await reprocessMessage(producerService, bucketService);

    expect(sendSpy).toHaveBeenCalledTimes(3);
    expect(sendSpy).toHaveBeenCalledWith("https://sqs.test-url.com/1234", {
      Records: [{ s3: { object: { key: "fileA" } } }],
    });
    expect(sendSpy).toHaveBeenCalledWith("https://sqs.test-url.com/1234", {
      Records: [{ s3: { object: { key: "fileB" } } }],
    });
    expect(sendSpy).toHaveBeenCalledWith("https://sqs.test-url.com/1234", {
      Records: [{ s3: { object: { key: "fileC" } } }],
    });
  });
});
