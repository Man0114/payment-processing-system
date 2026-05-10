import redis from '../config/redis';
import logger from '../utils/logger';
export const idempotencyMiddleware = async (req, res, next) => {
    const idempotencyKeyHeader = req.headers['idempotency-key'];
    if (typeof idempotencyKeyHeader !== 'string' || !idempotencyKeyHeader) {
        res.status(400).json({
            success: false,
            message: 'idempotency-key header is required',
        });
        return;
    }
    const idempotencyKey = idempotencyKeyHeader;
    try {
        // Check if key already exists in Redis
        const existingResponse = await redis.get(`idempotency:${idempotencyKey}`);
        if (existingResponse) {
            logger.info(`Duplicate request detected 🔁 — key: ${idempotencyKey}`);
            res.status(200).json({
                success: true,
                duplicate: true,
                data: JSON.parse(existingResponse),
            });
            return;
        }
        // Store original response after request completes
        const originalJson = res.json.bind(res);
        res.json = (body) => {
            // Save response in Redis for 24 hours
            redis.setex(`idempotency:${idempotencyKey}`, 86400, JSON.stringify(body));
            return originalJson(body);
        };
        // Attach key to request for later use
        req.headers['idempotency-key'] = idempotencyKey;
        next();
    }
    catch (error) {
        logger.error(`Idempotency middleware error: ${error}`);
        next(error);
    }
};
//# sourceMappingURL=idempotency.js.map