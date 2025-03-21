import { log } from "../utilities/logger";
import {
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  S3Client,
} from "@aws-sdk/client-s3";
import { s3NoObjectFoundError } from "../utilities/errors";

export const bucketServiceBuilder = (s3Client: S3Client) => {
  return {
    async getS3Objects(
      bucketName: string,
      s3KeyPath: string,
    ): Promise<string[]> {
      if (s3KeyPath.startsWith("s3://")) {
        // that is useful if backoffice copies s3Path from the button on aws and it includes the s3://bucketname
        const pathWithoutPrefix = s3KeyPath.substring(5);
        const indexOfNextSlash = pathWithoutPrefix.indexOf("/");
        bucketName = pathWithoutPrefix.substring(0, indexOfNextSlash);
        s3KeyPath = pathWithoutPrefix.substring(indexOfNextSlash + 1);
      }

      let continuationToken: string | undefined = undefined;
      let allKeys: string[] = [];

      do {
        const command = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: s3KeyPath,
          ContinuationToken: continuationToken,
        });

        const response: ListObjectsV2CommandOutput =
          await s3Client.send(command);
        log.info(
          `ListObjectResponse for s3KeyPath ${s3KeyPath}: \n Found ${JSON.stringify(response.KeyCount)} keys on path ${s3KeyPath}`,
        );

        if (response.Contents && response.Contents.length > 0) {
          const keys = response.Contents.map(({ Key }) => Key as string);
          allKeys = [...allKeys, ...keys];
        }

        continuationToken = response.NextContinuationToken;
      } while (continuationToken);

      if (allKeys.length === 0) {
        throw s3NoObjectFoundError(
          `No objects found for s3KeyPath ${s3KeyPath}`,
        );
      }

      return allKeys;
    },
  };
};

export type BucketService = ReturnType<typeof bucketServiceBuilder>;
