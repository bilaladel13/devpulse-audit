import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  pingIntervalMs: parseInt(process.env.PING_INTERVAL_MS || '10000', 10),
  defaultTimeoutMs: parseInt(process.env.DEFAULT_TIMEOUT_MS || '5000', 10),
  historyLimitPerEndpoint: 50,
};
