import logger from './logger';

interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
}

export const exponentialBackoff = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> => {
  const { maxRetries, initialDelay } = options;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      
      if (attempt === maxRetries) {
        logger.error(`All ${maxRetries} retries exhausted`);
        throw error;
      }

      const delay = initialDelay * Math.pow(2, attempt - 1);
      logger.info(`Retry attempt ${attempt}/${maxRetries}-waiting ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Retry failed');
};