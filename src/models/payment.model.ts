import mongoose, { Document, Schema } from 'mongoose';

export enum PaymentStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
}

export interface IPayment extends Document {
    paymentId: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    idempotencyKey: string;
    retryCount: number;
    maxRetries: number;
    lastError?: string;
    gatewayResponse?: object;
    webhookReceived: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
    paymentId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true, default: 'USD' },
    status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING },
    idempotencyKey: { type: String, required: true },
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    lastError: { type: String },
    gatewayResponse: { type: Object },
    webhookReceived: { type: Boolean, default: false },
}, { timestamps: true });

PaymentSchema.index({ status: 1 });

const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
export default Payment;