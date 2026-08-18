import type { RequestValidationResult } from "../../common/middlewares/validateRequest.js"; import type { InitiateMockPaymentInput, MockCallbackInput, MockResult, MockWebhookInput } from "./payments.types.js";
const results = ["SUCCEEDED", "FAILED"];
function object(body: unknown) { return body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : null; }
export function validateInitiateMockPaymentInput(body: unknown): RequestValidationResult<InitiateMockPaymentInput> {
  if (body === undefined || body === null || (typeof body === "object" && !Array.isArray(body) && !Object.keys(body).length)) return { data: {} };
  const input = object(body); if (!input) return { errors: { body: "Request body must be a JSON object" } };
  const errors: Record<string, string> = {};
  for (const key of Object.keys(input)) if (key !== "couponCode") errors[key] = `${key} cannot be set through this endpoint`;
  const couponCode = typeof input.couponCode === "string" ? input.couponCode.trim().toUpperCase() : "";
  if (input.couponCode !== undefined && (!couponCode || couponCode.length > 50)) errors.couponCode = "couponCode must be between 1 and 50 characters";
  return Object.keys(errors).length ? { errors } : { data: couponCode ? { couponCode } : {} };
}
export function validateMockCallbackInput(body: unknown): RequestValidationResult<MockCallbackInput> { const input = object(body); if (!input) return { errors: { body: "Request body must be an object" } }; const errors: Record<string, string> = {}; if (typeof input.token !== "string" || !input.token) errors.token = "token is required"; if (!results.includes(String(input.status))) errors.status = "status must be SUCCEEDED or FAILED"; return Object.keys(errors).length ? { errors } : { data: { token: input.token as string, status: input.status as MockResult } }; }
export function validateMockWebhookInput(body: unknown): RequestValidationResult<MockWebhookInput> { const input = object(body); if (!input) return { errors: { body: "Request body must be a JSON object" } }; const errors: Record<string, string> = {}; for (const key of ["eventId", "paymentId", "providerTransactionId", "currency"]) if (typeof input[key] !== "string" || !input[key]) errors[key] = `${key} is required`; if (!results.includes(String(input.status))) errors.status = "status must be SUCCEEDED or FAILED"; if (typeof input.amount !== "number" || input.amount < 0) errors.amount = "amount must be a non-negative number"; return Object.keys(errors).length ? { errors } : { data: input as unknown as MockWebhookInput }; }
