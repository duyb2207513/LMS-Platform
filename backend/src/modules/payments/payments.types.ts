export type MockResult = "SUCCEEDED" | "FAILED";
export interface MockWebhookInput { eventId: string; paymentId: string; status: MockResult; providerTransactionId: string; amount: number; currency: string }
export interface MockCallbackInput { token: string; status: MockResult }
