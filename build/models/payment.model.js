import mongoose, { Schema } from 'mongoose';
export var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["PROCESSING"] = "PROCESSING";
    PaymentStatus["SUCCESS"] = "SUCCESS";
    PaymentStatus["FAILED"] = "FAILED";
})(PaymentStatus || (PaymentStatus = {}));
const PaymentSchema = new Schema({
    paymentId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true, min: 1, },
    currency: { type: String, required: true, default: 'USD', },
    status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING, },
    idempotencyKey: { type: String, required: true },
    retryCount: { type: Number, default: 0, },
    maxRetries: { type: Number, default: 3, },
    lastError: { type: String, },
    gatewayResponse: { type: Object, },
    webhookReceived: { type: Boolean, default: false, },
}, { timestamps: true });
PaymentSchema.index({ status: 1 });
const Payment = mongoose.model('Payment', PaymentSchema);
export default Payment;
//# sourceMappingURL=payment.model.js.map