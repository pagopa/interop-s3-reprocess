export interface S3BodySchema {
  Records: Array<{
    eventName: string;
    s3: {
      object: {
        key: string;
      };
    };
  }>;
}
