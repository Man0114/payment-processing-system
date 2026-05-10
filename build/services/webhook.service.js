import Payment, { PaymentStatus } from '../models/payment.model';
import redis from '../config/redis';
import logger from '../utils/logger';
export class WebhookService {
    // ─── Handle Incoming Webhook ─────────────────────────────────
    async handleWebhook(payload) {
        const { paymentId, status, transactionId, error, timestamp } = payload;
        logger.info(`Webhook received 📨 — paymentId: ${paymentId} — status: ${status}`);
        // ─── Duplicate Webhook Check via Redis ───────────────────
        const webhookKey = `webhook:${paymentId}:${timestamp}`;
        const isDuplicate = await redis.get(webhookKey);
        if (isDuplicate) {
            logger.warn(`Duplicate webhook ignored 🔁 — paymentId: ${paymentId}`);
            return;
        }
        // Mark webhook as received in Redis (24 hours)
        await redis.setex(webhookKey, 86400, '1');
        // ─── Find Payment ────────────────────────────────────────
        const payment = await Payment.findOne({ paymentId });
        if (!payment) {
            logger.error(`Payment not found for webhook ❌ — paymentId: ${paymentId}`);
            return;
        }
        // ─── Conflict State Check ────────────────────────────────
        // If payment already SUCCESS — ignore webhook
        if (payment.status === PaymentStatus.SUCCESS) {
            logger.warn(`Payment already SUCCESS — ignoring webhook 🔁 — paymentId: ${paymentId}`);
            return;
        }
        // ─── Update Payment Status ───────────────────────────────
        const newStatus = this.mapWebhookStatus(status);
        if (!newStatus) {
            logger.error(`Invalid webhook status ❌ — status: ${status}`);
            return;
        }
        await Payment.findOneAndUpdate({ paymentId }, {
            status: newStatus,
            webhookReceived: true,
            gatewayResponse: {
                transactionId,
                error,
                webhookTimestamp: timestamp,
            },
            ...(error && { lastError: error }),
        });
        logger.info(`Payment updated via webhook ✅ — paymentId: ${paymentId} — newStatus: ${newStatus}`);
    }
    // ─── Map Webhook Status to Payment Status ────────────────────
    mapWebhookStatus(status) {
        const statusMap = {
            SUCCESS: PaymentStatus.SUCCESS,
            FAILED: PaymentStatus.FAILED,
            PENDING: PaymentStatus.PENDING,
            PROCESSING: PaymentStatus.PROCESSING,
        };
        return statusMap[status.toUpperCase()] || null;
    }
}
export default new WebhookService();
//# sourceMappingURL=webhook.service.js.map