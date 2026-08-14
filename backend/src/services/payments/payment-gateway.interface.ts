export interface RefundPaymentInput { paymentId: string; providerTransactionId: string | null; amount: number; currency: string; idempotencyKey: string }
export interface RefundPaymentResult { success: boolean; providerRefundId?: string; failureReason?: string; payload?: Record<string, string | number | boolean | null> }
export interface PaymentGateway { refundPayment(input: RefundPaymentInput): Promise<RefundPaymentResult> }
