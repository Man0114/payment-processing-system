import mongoose, { Document } from 'mongoose';
export declare enum PaymentStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED"
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
declare const Payment: mongoose.Model<IPayment, {}, {}, {}, mongoose.Document<unknown, {}, IPayment, {}, mongoose.DefaultSchemaOptions> & IPayment & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IPayment>;
export default Payment;
//# sourceMappingURL=payment.model.d.ts.map