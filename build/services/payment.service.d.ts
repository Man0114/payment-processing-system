import { IPayment } from '../models/payment.model';
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
export declare class PaymentService {
    createPayment(data: CreatePaymentDTO): Promise<PaymentResult>;
    processPayment(paymentId: string): Promise<void>;
    getPaymentStatus(paymentId: string): Promise<IPayment | null>;
    getAllPayments(): Promise<IPayment[]>;
    retryFailedPayment(paymentId: string): Promise<PaymentResult>;
}
declare const _default: PaymentService;
export default _default;
//# sourceMappingURL=payment.service.d.ts.map