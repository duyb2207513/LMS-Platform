import { Router } from "express";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { validateRequest } from "../../common/middlewares/validateRequest.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import {
  initiateMockPaymentController,
  mockCallbackController,
  mockCheckoutController,
  mockWebhookController,
} from "./payments.controller.js";
import {
  validateInitiateMockPaymentInput,
  validateMockCallbackInput,
  validateMockWebhookInput,
} from "./payments.validation.js";
export const orderPaymentsRouter = Router({ mergeParams: true });
/**
 * @openapi
 * /orders/{orderId}/payments/mock:
 *   post:
 *     summary: Initiate or reuse a pending mock payment
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: orderId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               couponCode: { type: string, example: WELCOME20 }
 *     responses: { 201: { description: Mock checkout URL created }, 409: { description: Order is not pending } }
 */
orderPaymentsRouter.post(
  "/",
  authenticate,
  authorize("STUDENT"),
  validateRequest(validateInitiateMockPaymentInput),
  asyncHandler(initiateMockPaymentController),
);
export const paymentsRouter = Router();
/**
 * @openapi
 * /payments/mock/{paymentId}:
 *   get:
 *     summary: Open the mock checkout page
 *     tags: [Payments]
 *     parameters: [{ in: path, name: paymentId, required: true, schema: { type: string, format: uuid } }, { in: query, name: token, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Mock HTML checkout page } }
 * /payments/mock/{paymentId}/callback:
 *   post:
 *     summary: Simulate a provider callback (idempotent)
 *     tags: [Payments]
 *     parameters: [{ in: path, name: paymentId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/MockPaymentCallbackRequest' } }, application/x-www-form-urlencoded: { schema: { $ref: '#/components/schemas/MockPaymentCallbackRequest' } } } }
 *     responses: { 200: { description: Payment result processed and enrollment created } }
 * /payments/webhooks/mock:
 *   post:
 *     summary: Receive a signed idempotent mock webhook
 *     tags: [Payment webhooks]
 *     parameters: [{ in: header, name: x-mock-signature, required: true, schema: { type: string } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/MockPaymentWebhookRequest' } } } }
 *     responses: { 200: { description: Webhook processed or previously processed }, 401: { description: Invalid signature } }
 */
paymentsRouter.get("/mock/:paymentId", asyncHandler(mockCheckoutController));
paymentsRouter.post(
  "/mock/:paymentId/callback",
  validateRequest(validateMockCallbackInput),
  asyncHandler(mockCallbackController),
);
paymentsRouter.post(
  "/webhooks/mock",
  validateRequest(validateMockWebhookInput),
  asyncHandler(mockWebhookController),
);
