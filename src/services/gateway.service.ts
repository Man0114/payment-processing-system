import logger from '../utils/logger';

export interface GatewayResponse {
  success: boolean;
  transactionId?: string;
  error?: string;
  delayed?: boolean;
}

// Simulate external payment gateway
export const simulateGateway = async (
  amount: number,
  currency: string
): Promise<GatewayResponse> => {
  
  // Simulate random delay (100ms - 3000ms)
  const delay = Math.floor(Math.random() * 3000) + 100;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Simulate timeout (10% chance)
  if (delay > 2500) {
    logger.warn(`Gateway timeout after ${delay}ms ⏱️`);
    throw new Error('GATEWAY_TIMEOUT');
  }

  // Random outcome simulation
  const random = Math.random();

  // 60% success
  if (random < 0.6) {
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    logger.info(`Gateway success ✅ — txn: ${transactionId}`);
    return {
      success: true,
      transactionId,
    };
  }

  // 25% failure
  if (random < 0.85) {
    logger.warn(`Gateway failed ❌ — insufficient funds`);
    return {
      success: false,
      error: 'INSUFFICIENT_FUNDS',
    };
  }

  // 15% random error
  logger.error(`Gateway error ❌ — internal error`);
  throw new Error('GATEWAY_INTERNAL_ERROR');
};