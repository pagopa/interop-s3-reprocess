import { log } from "../utilities/logger";
import {
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  S3Client,
} from "@aws-sdk/client-s3";
import { s3NoObjectFoundError } from "../utilities/errors";

export const bucketServiceBuilder = (s3Client: S3Client) => {
  return {
    async getS3Object(bucketName: string, s3KeyPath: string): Promise<string> {
      if (s3KeyPath.startsWith("s3://")) {
        // that is useful if backoffice copies s3Path from the button on aws and it includes the s3://bucketname
        const pathWithoutPrefix = s3KeyPath.substring(5);
        const indexOfNextSlash = pathWithoutPrefix.indexOf("/");

        bucketName = pathWithoutPrefix.substring(0, indexOfNextSlash);
        s3KeyPath = pathWithoutPrefix.substring(indexOfNextSlash + 1);
      }

      const command: ListObjectsV2Command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: s3KeyPath,
        MaxKeys: 1,
      });

      const response: ListObjectsV2CommandOutput = await s3Client.send(command);
      log.info(
        `ListObjectResponse for s3KeyPath ${s3KeyPath}: \n \n ${JSON.stringify(
          response,
        )}`,
      );

      if (response.Contents && response.Contents.length > 0) {
        return response.Contents[0].Key;
      } else {
        throw s3NoObjectFoundError(
          `No object found for s3KeyPath ${s3KeyPath}`,
        );
      }
    },
  };
};

export type BucketService = ReturnType<typeof bucketServiceBuilder>;
