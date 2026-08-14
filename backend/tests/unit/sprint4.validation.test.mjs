import assert from "node:assert/strict";
import { validateCreateOrderInput } from "../../dist/modules/orders/orders.validation.js";
import { validateMockCallbackInput, validateMockWebhookInput } from "../../dist/modules/payments/payments.validation.js";

const idA = "11111111-1111-4111-8111-111111111111";
const idB = "22222222-2222-4222-8222-222222222222";

assert.deepEqual(validateCreateOrderInput({ courseIds: [idA, idB] }).data, { courseIds: [idA, idB] });
assert.ok(validateCreateOrderInput({ courseIds: [] }).errors.courseIds);
assert.ok(validateCreateOrderInput({ courseIds: [idA, idA] }).errors.courseIds);
assert.ok(validateCreateOrderInput({ courseIds: [idA], role: "ADMIN" }).errors.role);

assert.deepEqual(validateMockCallbackInput({ token: "secret", status: "SUCCEEDED" }).data, { token: "secret", status: "SUCCEEDED" });
assert.ok(validateMockCallbackInput({ token: "", status: "UNKNOWN" }).errors.token);
assert.ok(validateMockCallbackInput({ token: "", status: "UNKNOWN" }).errors.status);

const webhook = { eventId: "event-1", paymentId: idA, status: "FAILED", providerTransactionId: "tx-1", amount: 299000, currency: "VND" };
assert.equal(validateMockWebhookInput(webhook).data.status, "FAILED");
assert.ok(validateMockWebhookInput({ ...webhook, amount: -1 }).errors.amount);
assert.ok(validateMockWebhookInput({ ...webhook, eventId: "" }).errors.eventId);

console.log("Sprint 4 validation unit tests passed");
