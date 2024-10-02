import winston from "winston";

const logLevel = process.env.LOG_LEVEL || "info";

const logFormat = winston.format.printf(
  ({ level, message, timestamp, ...meta }) => {
    const formattedMessage =
      typeof message === "object" ? JSON.stringify(message) : message;

    const metadataString = meta ? JSON.stringify(meta) : "";
    return `${timestamp} [${level.toUpperCase()}] - ${formattedMessage} ${metadataString}`;
  },
);

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(winston.format.timestamp(), logFormat),
  transports: [new winston.transports.Console()],
});

export const log = {
  debug: (message: string, meta?: Record<string, unknown>) =>
    logger.debug(message, meta),
  info: (message: string, meta?: Record<string, unknown>) =>
    logger.info(message, meta),
  warn: (message: string, meta?: Record<string, unknown>) =>
    logger.warn(message, meta),
  error: (message: string, meta?: Record<string, unknown>) =>
    logger.error(message, meta),
};
