import { createHash } from "node:crypto";
import type { PaymentGateway, RefundPaymentInput } from "./payment-gateway.interface.js";
export class MockPaymentGateway implements PaymentGateway { async refundPayment(input: RefundPaymentInput) { const reference = createHash("sha256").update(input.idempotencyKey).digest("hex").slice(0, 24); return { success: true, providerRefundId: `MOCK-REFUND-${reference}`, payload: { sandbox: true, paymentId: input.paymentId, amount: input.amount, currency: input.currency } }; } }
export const mockPaymentGateway = new MockPaymentGateway();
