import Payment, { PaymentStatus } from '../models/payment.model';
import redis from '../config/redis';
import logger from '../utils/logger';

export interface WebhookPayload {
  paymentId: string;
  status: string;
  transactionId?: string;
  error?: string;
  timestamp: string;
}

export class WebhookService {
  async handleWebhook(payload: WebhookPayload): Promise<void> {
    const { paymentId, status, transactionId, error, timestamp } = payload;

    logger.info(`Webhook received - paymentId: ${paymentId} - status: ${status}`);

    const webhookKey = `webhook:${paymentId}:${timestamp}`;
    const isDuplicate = await redis.get(webhookKey);

    if (isDuplicate) {
      logger.warn(`Duplicate webhook ignored - paymentId: ${paymentId}`);
      return;
    }

    await redis.setex(webhookKey, 86400, '1');

    const payment = await Payment.findOne({ paymentId });

    if (!payment) {
      logger.error(`Payment not found for webhook - paymentId: ${paymentId}`);
      return;
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      logger.warn(`Payment already SUCCESS - ignoring webhook - paymentId: ${paymentId}`);
      return;
    }

    const newStatus = this.mapWebhookStatus(status);

    if (!newStatus) {
      logger.error(`Invalid webhook status - status: ${status}`);
      return;
    }

    await Payment.findOneAndUpdate(
      { paymentId },
      {
        status: newStatus,
        webhookReceived: true,
        gatewayResponse: {
          transactionId,
          error,
          webhookTimestamp: timestamp,
        },
        ...(error && { lastError: error }),
      }
    );

    logger.info(`Payment updated via webhook - paymentId: ${paymentId} - newStatus: ${newStatus}`);
  }

  private mapWebhookStatus(status: string): PaymentStatus | null {
    const statusMap: Record<string, PaymentStatus> = {
      SUCCESS: PaymentStatus.SUCCESS,
      FAILED: PaymentStatus.FAILED,
      PENDING: PaymentStatus.PENDING,
      PROCESSING: PaymentStatus.PROCESSING,
    };

    return statusMap[status.toUpperCase()] || null;
  }
}

export default new WebhookService();