import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { v4 as uuidv4 } from 'uuid';
import Payment, { PaymentStatus } from '../src/models/payment.model';
import webhookService from '../src/services/webhook.service';

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

describe('WebhookService', () => {

  it('should update payment status via webhook', async () => {
    const paymentId = uuidv4();
    await Payment.create({
      paymentId,
      amount: 100,
      currency: 'USD',
      status: PaymentStatus.PROCESSING,
      idempotencyKey: `key-${paymentId}`,
    });

    await webhookService.handleWebhook({
      paymentId,
      status: 'SUCCESS',
      transactionId: 'TXN_123',
      timestamp: new Date().toISOString(),
    });

    const updated = await Payment.findOne({ paymentId });
    expect(updated?.status).toBe(PaymentStatus.SUCCESS);
    expect(updated?.webhookReceived).toBe(true);
  }, 10000);

  it('should not update already SUCCESS payment', async () => {
    const paymentId = uuidv4();
    await Payment.create({
      paymentId,
      amount: 100,
      currency: 'USD',
      status: PaymentStatus.SUCCESS,
      idempotencyKey: `key-${paymentId}`,
    });

    await webhookService.handleWebhook({
      paymentId,
      status: 'FAILED',
      timestamp: new Date().toISOString(),
    });

    const payment = await Payment.findOne({ paymentId });
    expect(payment?.status).toBe(PaymentStatus.SUCCESS);
  }, 10000);

  it('should handle non-existing payment gracefully', async () => {
    await expect(
      webhookService.handleWebhook({
        paymentId: 'non-existing-id',
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
      })
    ).resolves.not.toThrow();
  }, 10000);
});