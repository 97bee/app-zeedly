import { Logger } from "@aws-lambda-powertools/logger";

export const logger = new Logger({
  serviceName: "zeedly-api",
  logLevel: process.env.NODE_ENV === "production" ? "INFO" : "DEBUG",
});
