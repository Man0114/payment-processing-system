import logger from './logger';
export const exponentialBackoff = async (fn, options) => {
    const { maxRetries, initialDelay } = options;
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            return await fn();
        }
        catch (error) {
            attempt++;
            if (attempt === maxRetries) {
                logger.error(`All ${maxRetries} retries exhausted ❌`);
                throw error;
            }
            // Exponential backoff delay — 1s, 2s, 4s...
            const delay = initialDelay * Math.pow(2, attempt - 1);
            logger.info(`Retry attempt ${attempt}/${maxRetries} — waiting ${delay}ms`);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    throw new Error('Retry failed');
};
//# sourceMappingURL=retry.js.map