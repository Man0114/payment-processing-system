import paymentService from '../services/payment.service';
import webhookService from '../services/webhook.service';
import logger from '../utils/logger';
export class PaymentController {
    // ─── Create Payment ──────────────────────────────────────────
    async createPayment(req, res) {
        try {
            const { amount, currency } = req.body;
            const idempotencyKeyHeader = req.headers['idempotency-key'];
            if (typeof idempotencyKeyHeader !== 'string') {
                res.status(400).json({
                    success: false,
                    message: 'idempotency-key header is required',
                });
                return;
            }
            const idempotencyKey = idempotencyKeyHeader;
            // Validate inputs
            if (!amount || !currency) {
                res.status(400).json({
                    success: false,
                    message: 'amount and currency are required',
                });
                return;
            }
            if (amount <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'amount must be greater than 0',
                });
                return;
            }
            const result = await paymentService.createPayment({
                amount,
                currency,
                idempotencyKey,
            });
            res.status(201).json({
                success: true,
                message: result.message,
                data: result.payment,
            });
        }
        catch (error) {
            logger.error(`Create payment error: ${error.message}`);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error',
            });
        }
    }
    // ─── Get Payment Status ──────────────────────────────────────
    async getPaymentStatus(req, res) {
        try {
            const { paymentId } = req.params;
            if (typeof paymentId !== 'string' || !paymentId) {
                res.status(400).json({
                    success: false,
                    message: 'paymentId param is required',
                });
                return;
            }
            const payment = await paymentService.getPaymentStatus(paymentId);
            if (!payment) {
                res.status(404).json({
                    success: false,
                    message: 'Payment not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: payment,
            });
        }
        catch (error) {
            logger.error(`Get payment status error: ${error.message}`);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error',
            });
        }
    }
    // ─── Get All Payments ────────────────────────────────────────
    async getAllPayments(req, res) {
        try {
            const payments = await paymentService.getAllPayments();
            res.status(200).json({
                success: true,
                count: payments.length,
                data: payments,
            });
        }
        catch (error) {
            logger.error(`Get all payments error: ${error.message}`);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error',
            });
        }
    }
    // ─── Retry Failed Payment ────────────────────────────────────
    async retryPayment(req, res) {
        try {
            const { paymentId } = req.params;
            if (typeof paymentId !== 'string' || !paymentId) {
                res.status(400).json({
                    success: false,
                    message: 'paymentId param is required',
                });
                return;
            }
            const result = await paymentService.retryFailedPayment(paymentId);
            res.status(200).json({
                success: true,
                message: result.message,
                data: result.payment,
            });
        }
        catch (error) {
            logger.error(`Retry payment error: ${error.message}`);
            res.status(400).json({
                success: false,
                message: error.message || 'Internal server error',
            });
        }
    }
    // ─── Handle Webhook ──────────────────────────────────────────
    async handleWebhook(req, res) {
        try {
            const payload = req.body;
            if (!payload.paymentId || !payload.status) {
                res.status(400).json({
                    success: false,
                    message: 'paymentId and status are required',
                });
                return;
            }
            // Add timestamp if not present
            if (!payload.timestamp) {
                payload.timestamp = new Date().toISOString();
            }
            await webhookService.handleWebhook(payload);
            res.status(200).json({
                success: true,
                message: 'Webhook received successfully',
            });
        }
        catch (error) {
            logger.error(`Webhook error: ${error.message}`);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error',
            });
        }
    }
}
export default new PaymentController();
//# sourceMappingURL=payment.controller.js.map