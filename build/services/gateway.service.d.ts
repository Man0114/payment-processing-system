export interface GatewayResponse {
    success: boolean;
    transactionId?: string;
    error?: string;
    delayed?: boolean;
}
export declare const simulateGateway: (amount: number, currency: string) => Promise<GatewayResponse>;
//# sourceMappingURL=gateway.service.d.ts.map