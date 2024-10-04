export class InternalError<T> extends Error {
  public code: T;
  public detail: string;

  constructor({ code, detail }: { code: T; detail: string }) {
    super(detail);
    this.code = code;
    this.detail = detail;
  }
}

const errorCodes = {
  genericError: "GENERIC_ERROR",
  sqsSendMessageError: "SQS_SEND_MESSAGE_ERROR",
  s3NoObjectFoundError: "S3_NO_OBJECT_FOUND_ERROR",
  missingRequiredEnvironmentVariablesError:
    "MISSING_REQUIRED_ENVIRONMENT_VARIABLES_ERROR",
} as const;

export type CommonErrorCodes = keyof typeof errorCodes;

export function genericInternalError(
  details: string,
): InternalError<CommonErrorCodes> {
  return new InternalError({
    code: "genericError",
    detail: details,
  });
}

export function sqsSendMessageError(
  details: string,
): InternalError<CommonErrorCodes> {
  return new InternalError({
    code: "sqsSendMessageError",
    detail: details,
  });
}

export function s3NoObjectFoundError(
  details: string,
): InternalError<CommonErrorCodes> {
  return new InternalError({
    code: "s3NoObjectFoundError",
    detail: details,
  });
}

export function missingRequiredEnvironmentVariablesError(
  details: string,
): InternalError<CommonErrorCodes> {
  return new InternalError({
    code: "missingRequiredEnvironmentVariablesError",
    detail: details,
  });
}
