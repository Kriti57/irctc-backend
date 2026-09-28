import dotenv from "dotenv";
dotenv.config();

const config = {
  SERVICE_NAME: process.env.SERVICE_NAME || "user-service",
  PORT: Number(process.env.PORT) || 4001,
  NODE_ENV: process.env.NODE_ENV || "development",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL || "redis://:irctcpass@redis:6379",
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || "http://localhost:4000",
  
  OTP_TTL: process.env.OTP_TTL || 300,
  OTP_RATE_MAX_PER_HOUR: process.env.OTP_RATE_MAX_PER_HOUR || 5,
  OTP_MAX_VERIFY_ATTEMPTS: process.env.OTP_MAX_VERIFY_ATTEMPTS || 5,
  OTP_HMAC_SECRET: process.env.OTP_HMAC_SECRET,

  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  MAIL_SEND: process.env.MAIL_SEND,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXP: process.env.ACCESS_TOKEN_EXP || "15m",
  REFRESH_TOKEN_EXP: process.env.REFRESH_TOKEN_EXP || "7d",
  ACCESS_TOKEN_EXP_SEC: Number(process.env.ACCESS_TOKEN_EXP_SEC || 900),
  REFRESH_TOKEN_EXP_SEC: Number(process.env.REFRESH_TOKEN_EXP_SEC || 604800),

  REDIS_USER_TTL: Number(process.env.REDIS_USER_TTL || 86400),
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID,
  KAFKA_BROKER: process.env.KAFKA_BROKER,
};

if(!config.GOOGLE_CLIENT_ID) {
  throw new Error("GOOGLE_CLIENT_ID environment variable is required");
}

if(!config.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY missing");
}

export default config;