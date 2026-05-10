import { Request, Response } from 'express';
export declare class PaymentController {
    createPayment(req: Request, res: Response): Promise<void>;
    getPaymentStatus(req: Request, res: Response): Promise<void>;
    getAllPayments(req: Request, res: Response): Promise<void>;
    retryPayment(req: Request, res: Response): Promise<void>;
    handleWebhook(req: Request, res: Response): Promise<void>;
}
declare const _default: PaymentController;
export default _default;
//# sourceMappingURL=payment.controller.d.ts.map