export interface WebhookPayload {
    paymentId: string;
    status: string;
    transactionId?: string;
    error?: string;
    timestamp: string;
}
export declare class WebhookService {
    handleWebhook(payload: WebhookPayload): Promise<void>;
    private mapWebhookStatus;
}
declare const _default: WebhookService;
export default _default;
//# sourceMappingURL=webhook.service.d.ts.map