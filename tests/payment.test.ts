import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Payment, { PaymentStatus } from '../src/models/payment.model';
import paymentService from '../src/services/payment.service';

jest.mock('../src/config/redis', () => ({
  get: jest.fn().mockResolvedValue(null),
  setex: jest.fn().mockResolvedValue('OK'),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
}));

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}, 30000);

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
}, 30000);

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('PaymentService', () => {

  describe('createPayment', () => {
    it('should create a new payment successfully', async () => {
      const result = await paymentService.createPayment({
        amount: 100,
        currency: 'USD',
        idempotencyKey: 'test-key-001',
      });
      expect(result.success).toBe(true);
      expect(result.payment.amount).toBe(100);
      expect(result.payment.status).toBe(PaymentStatus.PENDING);
    }, 10000);

    it('should return existing payment for duplicate idempotency key', async () => {
      const data = {
        amount: 100,
        currency: 'USD',
        idempotencyKey: 'test-key-002',
      };
      const first = await paymentService.createPayment(data);
      const second = await paymentService.createPayment(data);
      expect(first.payment.paymentId).toBe(second.payment.paymentId);
      expect(second.message).toBe('Payment already exists');
    }, 10000);
  });

  describe('getPaymentStatus', () => {
    it('should return payment by paymentId', async () => {
      const paymentId = `pay-${Date.now()}`;
      await Payment.create({
        paymentId,
        amount: 200,
        currency: 'USD',
        status: PaymentStatus.PENDING,
        idempotencyKey: `key-${paymentId}`,
      });
      const payment = await paymentService.getPaymentStatus(paymentId);
      expect(payment).not.toBeNull();
      expect(payment?.paymentId).toBe(paymentId);
    }, 10000);

    it('should return null for non-existing payment', async () => {
      const payment = await paymentService.getPaymentStatus('non-existing-id');
      expect(payment).toBeNull();
    }, 10000);
  });

  describe('retryFailedPayment', () => {
    it('should retry a failed payment', async () => {
      const paymentId = `pay-${Date.now()}`;
      await Payment.create({
        paymentId,
        amount: 300,
        currency: 'USD',
        status: PaymentStatus.FAILED,
        idempotencyKey: `key-${paymentId}`,
      });
      const result = await paymentService.retryFailedPayment(paymentId);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Payment retry initiated');
    }, 10000);

    it('should not retry a successful payment', async () => {
      const paymentId = `pay-${Date.now()}-success`;
      await Payment.create({
        paymentId,
        amount: 300,
        currency: 'USD',
        status: PaymentStatus.SUCCESS,
        idempotencyKey: `key-${paymentId}`,
      });
      await expect(
        paymentService.retryFailedPayment(paymentId)
      ).rejects.toThrow('Only failed payments can be retried');
    }, 10000);

    it('should throw error for non-existing payment', async () => {
      await expect(
        paymentService.retryFailedPayment('non-existing-id')
      ).rejects.toThrow('Payment not found');
    }, 10000);
  });
});