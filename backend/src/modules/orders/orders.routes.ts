import { Router } from "express"; import { authenticate } from "../../common/middlewares/authenticate.js"; import { authorize } from "../../common/middlewares/authorize.js"; import { validateRequest } from "../../common/middlewares/validateRequest.js"; import { asyncHandler } from "../../common/utils/asyncHandler.js"; import { cancelOrderController, createOrderController, getOrderController, listMyOrdersController } from "./orders.controller.js"; import { validateCreateOrderInput } from "./orders.validation.js";
const router = Router();
/**
 * @openapi
 * /orders:
 *   post:
 *     summary: Create an order with immutable course price snapshots
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     requestBody: { required: true, content: { application/json: { schema: { type: object, required: [courseIds], properties: { courseIds: { type: array, items: { type: string, format: uuid } }, couponCode: { type: string, example: WELCOME20 } } } } } }
 *     responses: { 201: { description: Order created successfully }, 404: { description: Published course not found }, 409: { description: Free or already-enrolled course } }
 * /orders/me:
 *   get:
 *     summary: List current student's orders
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Orders retrieved successfully } }
 * /orders/{orderId}:
 *   get:
 *     summary: Get own order detail
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: orderId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: Order retrieved successfully }, 404: { description: Order not found } }
 *   delete:
 *     summary: Cancel a pending unpaid order
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: orderId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 204: { description: Order cancelled }, 409: { description: Order cannot be cancelled } }
 */
router.post("/", authenticate, authorize("STUDENT"), validateRequest(validateCreateOrderInput), asyncHandler(createOrderController)); router.get("/me", authenticate, authorize("STUDENT"), asyncHandler(listMyOrdersController)); router.get("/:orderId", authenticate, asyncHandler(getOrderController)); router.delete("/:orderId", authenticate, authorize("STUDENT"), asyncHandler(cancelOrderController)); export default router;
