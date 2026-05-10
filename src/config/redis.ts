import dotenv from 'dotenv';
import Redis from 'ioredis';
import logger from '../utils/logger';

dotenv.config();

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

redis.on('connect', () => {
  logger.info('Redis Connected!');
});

redis.on('error', (error) => {
  logger.error(`Redis Connection Failed: ${error}`);
});

export default redis;