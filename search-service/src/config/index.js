import dotenv from "dotenv";
dotenv.config();

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const config = {
  SERVICE_NAME: process.env.SERVICE_NAME || "search-service",
  PORT: Number(process.env.PORT) || 4002,
  NODE_ENV: process.env.NODE_ENV || "development",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || "http://localhost:3000",

  ELASTICSEARCH_URL: process.env.ELASTICSEARCH_URL || "http://localhost:9200",

  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID,
  KAFKA_BROKER: process.env.KAFKA_BROKER || "localhost:9093",
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || "search-service-group",
};

export default config;