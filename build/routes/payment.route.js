import { Router } from 'express';
import paymentController from '../controllers/payment.controller';
import { idempotencyMiddleware } from '../middlewares/idempotency';
import { concurrencyMiddleware } from '../middlewares/concurrency';
const router = Router();
// ─── Payment Routes ───────────────────────────────────────────
// Create payment
router.post('/', idempotencyMiddleware, paymentController.createPayment);
// Get all payments
router.get('/', paymentController.getAllPayments);
// Get payment status
router.get('/:paymentId', paymentController.getPaymentStatus);
// Retry failed payment
router.post('/:paymentId/retry', concurrencyMiddleware, paymentController.retryPayment);
// Webhook handler
router.post('/webhook/callback', paymentController.handleWebhook);
export default router;
//# sourceMappingURL=payment.route.js.map