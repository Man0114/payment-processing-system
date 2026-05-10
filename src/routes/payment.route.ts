import { Router } from 'express';
import paymentController from '../controllers/payment.controller';
import { idempotencyMiddleware } from '../middlewares/idempotency';
import { redisLockMiddleware } from '../middlewares/redisLock';
const router = Router();

router.post('/', idempotencyMiddleware, paymentController.createPayment);
router.get('/', paymentController.getAllPayments);
router.get('/:paymentId', paymentController.getPaymentStatus);
router.post('/:paymentId/retry', redisLockMiddleware, paymentController.retryPayment);
router.post('/webhook/callback', paymentController.handleWebhook);

export default router;