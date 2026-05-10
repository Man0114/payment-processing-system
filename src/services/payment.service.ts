import { v4 as uuidv4 } from 'uuid';
import Payment, { IPayment, PaymentStatus } from '../models/payment.model';
import { simulateGateway } from './gateway.service';
import { exponentialBackoff } from '../utils/retry';
import logger from '../utils/logger';
import redis from '../config/redis';

export interface CreatePaymentDTO {
  amount: number;
  currency: string;
  idempotencyKey: string;
}

export interface PaymentResult {
  success: boolean;
  payment: IPayment;
  message: string;
}

export class PaymentService {

  // ─── Create & Process Payment ───────────────────────────────
  async createPayment(data: CreatePaymentDTO): Promise<PaymentResult> {
    const { amount, currency, idempotencyKey } = data;

    // Check if payment already exists with same idempotency key
    const existingPayment = await Payment.findOne({ idempotencyKey });
    if (existingPayment) {
      logger.info(`Payment already exists 🔁 — key: ${idempotencyKey}`);
      return {
        success: true,
        payment: existingPayment,
        message: 'Payment already exists',
      };
    }

    // Create new payment
    const payment = await Payment.create({
      paymentId: uuidv4(),
      amount,
      currency,
      idempotencyKey,
      status: PaymentStatus.PENDING,
    });

    logger.info(`Payment created ✅ — id: ${payment.paymentId}`);

    // Process payment asynchronously
    this.processPayment(payment.paymentId);

    return {
      success: true,
      payment,
      message: 'Payment initiated successfully',
    };
  }

  // ─── Process Payment with Retry ─────────────────────────────
  async processPayment(paymentId: string): Promise<void> {
    const payment = await Payment.findOne({ paymentId });

    if (!payment) {
      logger.error(`Payment not found ❌ — id: ${paymentId}`);
      return;
    }

    // Update status to PROCESSING
    await Payment.findOneAndUpdate(
      { paymentId },
      { status: PaymentStatus.PROCESSING }
    );

    logger.info(`Payment processing 🔄 — id: ${paymentId}`);

    try {
      // Call gateway with retry logic
      const gatewayResponse = await exponentialBackoff(
        async () => {
          const response = await simulateGateway(
            payment.amount,
            payment.currency
          );

          // If gateway returned failure (not exception)
          if (!response.success) {
            throw new Error(response.error || 'GATEWAY_FAILED');
          }

          return response;
        },
        {
          maxRetries: payment.maxRetries,
          initialDelay: 1000,
        }
      );

      // Update to SUCCESS
      await Payment.findOneAndUpdate(
        { paymentId },
        {
          status: PaymentStatus.SUCCESS,
          gatewayResponse,
          retryCount: payment.retryCount,
        }
      );

      logger.info(`Payment success ✅ — id: ${paymentId}`);

    } catch (error: any) {
      // Update retry count
      const updatedPayment = await Payment.findOne({ paymentId });
      const retryCount = (updatedPayment?.retryCount || 0) + 1;

      // Update to FAILED
      await Payment.findOneAndUpdate(
        { paymentId },
        {
          status: PaymentStatus.FAILED,
          lastError: error.message,
          retryCount,
        }
      );

      logger.error(`Payment failed ❌ — id: ${paymentId} — error: ${error.message}`);
    }
  }

  // ─── Get Payment Status ──────────────────────────────────────
  async getPaymentStatus(paymentId: string): Promise<IPayment | null> {
    const payment = await Payment.findOne({ paymentId });

    if (!payment) {
      logger.warn(`Payment not found ⚠️ — id: ${paymentId}`);
      return null;
    }

    logger.info(`Payment status fetched — id: ${paymentId} — status: ${payment.status}`);
    return payment;
  }

  // ─── Get All Payments ────────────────────────────────────────
  async getAllPayments(): Promise<IPayment[]> {
    return await Payment.find().sort({ createdAt: -1 });
  }

  // ─── Retry Failed Payment ────────────────────────────────────
  async retryFailedPayment(paymentId: string): Promise<PaymentResult> {
    const payment = await Payment.findOne({ paymentId });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== PaymentStatus.FAILED) {
      throw new Error('Only failed payments can be retried');
    }

    // Reset for retry
    await Payment.findOneAndUpdate(
      { paymentId },
      {
        status: PaymentStatus.PENDING,
        retryCount: 0,
        lastError: null,
      }
    );

    logger.info(`Payment retry initiated 🔁 — id: ${paymentId}`);

    // Process again
    this.processPayment(paymentId);

    const updatedPayment = await Payment.findOne({ paymentId });

    return {
      success: true,
      payment: updatedPayment!,
      message: 'Payment retry initiated',
    };
  }
}

export default new PaymentService();