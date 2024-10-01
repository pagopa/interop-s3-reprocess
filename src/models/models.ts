export interface S3BodySchema {
  Records: Array<{
    s3: {
      object: {
        key: string;
      };
    };
  }>;
}
