import logger from '../utils/logger';

export interface GatewayResponse {
  success: boolean;
  transactionId?: string;
  error?: string;
  delayed?: boolean;
}

export const simulateGateway = async (): Promise<GatewayResponse> => {
  const delay = Math.floor(Math.random() * 3000) + 100;
  await new Promise((resolve) => setTimeout(resolve, delay));

  if (delay > 2500) {
    logger.warn(`Gateway timeout after ${delay}ms`);
    throw new Error('GATEWAY_TIMEOUT');
  }

  const random = Math.random();

  if (random < 0.6) {
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    logger.info(`Gateway success-txn: ${transactionId}`);
    return { success: true, transactionId };
  }

  if (random < 0.85) {
    logger.warn(`Gateway failed-insufficient funds`);
    return { success: false, error: 'INSUFFICIENT_FUNDS' };
  }

  logger.error(`Gateway error-internal error`);
  throw new Error('GATEWAY_INTERNAL_ERROR');
}
