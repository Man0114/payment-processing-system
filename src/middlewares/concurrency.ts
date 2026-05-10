import { Request, Response, NextFunction } from 'express';
import redis from '../config/redis';
import logger from '../utils/logger';

export const concurrencyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const paymentId = req.params.paymentId || req.body.paymentId;

  if (!paymentId) {
    next();
    return;
  }

  const lockKey = `lock:${paymentId}`;

  try {
    // Try to set lock — NX means only set if not exists
    const lock = await redis.set(lockKey, '1', 'EX', 30, 'NX');

    if (!lock) {
      logger.warn(`Payment already processing 🔒 — paymentId: ${paymentId}`);
      res.status(409).json({
        success: false,
        message: 'Payment is already being processed',
      });
      return;
    }

    // Release lock after response
    res.on('finish', async () => {
      await redis.del(lockKey);
      logger.info(`Lock released 🔓 — paymentId: ${paymentId}`);
    });

    next();

  } catch (error) {
    logger.error(`Concurrency middleware error: ${error}`);
    next(error);
  }
};