import { Router } from "express"; import { authenticate } from "../../common/middlewares/authenticate.js"; import { authorize } from "../../common/middlewares/authorize.js"; import { validateRequest } from "../../common/middlewares/validateRequest.js"; import { asyncHandler } from "../../common/utils/asyncHandler.js"; import { adminListController, approveController, cancelController, createController, detailController, mineController, rejectController } from "./refund.controller.js"; import { validateCreateRefund, validateReviewRefund } from "./refund.validation.js";
export const refundRouter = Router(), adminRefundRouter = Router();
/**
 * @openapi
 * /refund-requests:
 *   post: { summary: Submit a full refund request for an owned paid order, tags: [Refunds], security: [{ bearerAuth: [] }], requestBody: { required: true, content: { application/json: { schema: { type: object, required: [orderId, reason], properties: { orderId: { type: string, format: uuid }, reason: { type: string, minLength: 10, maxLength: 2000 } } } } } }, responses: { 201: { description: Refund request created }, 409: { description: Refund policy rejected } } }
 * /refund-requests/me:
 *   get: { summary: List current student's refund requests, tags: [Refunds], security: [{ bearerAuth: [] }], responses: { 200: { description: Refund history } } }
 * /refund-requests/{id}:
 *   get: { summary: Get an owned refund request or any request as admin, tags: [Refunds], security: [{ bearerAuth: [] }], parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }], responses: { 200: { description: Refund detail }, 404: { description: Not found or not owned } } }
 * /refund-requests/{id}/cancel:
 *   patch: { summary: Cancel an owned pending refund request, tags: [Refunds], security: [{ bearerAuth: [] }], responses: { 200: { description: Refund request cancelled } } }
 * /admin/refund-requests:
 *   get: { summary: List refund requests for administration, tags: [Admin refunds], security: [{ bearerAuth: [] }], responses: { 200: { description: Paginated refund requests } } }
 * /admin/refund-requests/{id}/approve:
 *   post: { summary: Idempotently approve and process a sandbox refund, tags: [Admin refunds], security: [{ bearerAuth: [] }], parameters: [{ in: header, name: Idempotency-Key, required: true, schema: { type: string } }], requestBody: { required: true, content: { application/json: { schema: { type: object, required: [adminNote], properties: { adminNote: { type: string, minLength: 3 } } } } } }, responses: { 200: { description: Refund processed }, 409: { description: Invalid state } } }
 * /admin/refund-requests/{id}/reject:
 *   post: { summary: Reject a pending refund request, tags: [Admin refunds], security: [{ bearerAuth: [] }], requestBody: { required: true, content: { application/json: { schema: { type: object, required: [adminNote], properties: { adminNote: { type: string, minLength: 3 } } } } } }, responses: { 200: { description: Refund rejected } } }
 */
refundRouter.use(authenticate); refundRouter.post("/", authorize("STUDENT"), validateRequest(validateCreateRefund), asyncHandler(createController)); refundRouter.get("/me", authorize("STUDENT"), asyncHandler(mineController)); refundRouter.get("/:id", asyncHandler(detailController)); refundRouter.patch("/:id/cancel", authorize("STUDENT"), asyncHandler(cancelController));
adminRefundRouter.use(authenticate, authorize("ADMIN")); adminRefundRouter.get("/", asyncHandler(adminListController)); adminRefundRouter.post("/:id/approve", validateRequest(validateReviewRefund), asyncHandler(approveController)); adminRefundRouter.post("/:id/reject", validateRequest(validateReviewRefund), asyncHandler(rejectController));
