import { Router } from "express";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { validateRequest } from "../../common/middlewares/validateRequest.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { createController, detailController, listController, statusController, updateController, usagesController, validateController } from "./coupon.controller.js";
import { validateCouponInput, validateCouponStatusInput, validateCreateCouponInput, validateUpdateCouponInput } from "./coupon.validation.js";

export const couponRouter = Router();
export const adminCouponRouter = Router();
/**
 * @openapi
 * /coupons/validate:
 *   post:
 *     summary: Validate a coupon and calculate authoritative course pricing
 *     tags: [Coupons]
 *     security: [{ bearerAuth: [] }]
 *     requestBody: { required: true, content: { application/json: { schema: { type: object, required: [code, courseId], properties: { code: { type: string, example: WELCOME20 }, courseId: { type: string, format: uuid } } } } } }
 *     responses: { 200: { description: Coupon pricing calculated }, 404: { description: Coupon or course not found }, 409: { description: Coupon business rule rejected } }
 * /admin/coupons:
 *   get:
 *     summary: List coupons
 *     tags: [Admin coupons]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Paginated coupons }, 403: { description: Admin only } }
 *   post:
 *     summary: Create a coupon
 *     tags: [Admin coupons]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name, discountType, discountValue, startsAt, expiresAt, appliesToAllCourses, courseIds, isActive]
 *             properties:
 *               code: { type: string, example: WELCOME20 }
 *               name: { type: string, example: Welcome discount }
 *               description: { type: string, nullable: true }
 *               discountType: { type: string, enum: [PERCENTAGE, FIXED_AMOUNT] }
 *               discountValue: { type: integer, minimum: 1 }
 *               maxDiscountAmount: { type: integer, minimum: 1, nullable: true }
 *               minOrderAmount: { type: integer, minimum: 1, nullable: true }
 *               startsAt: { type: string, format: date-time }
 *               expiresAt: { type: string, format: date-time }
 *               maxRedemptions: { type: integer, minimum: 1, nullable: true }
 *               appliesToAllCourses: { type: boolean }
 *               courseIds: { type: array, items: { type: string, format: uuid } }
 *               isActive: { type: boolean }
 *     responses: { 201: { description: Coupon created }, 409: { description: Duplicate code } }
 * /admin/coupons/{id}:
 *   get: { summary: Get coupon detail, tags: [Admin coupons], security: [{ bearerAuth: [] }], parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }], responses: { 200: { description: Coupon detail } } }
 *   patch: { summary: Update a coupon, tags: [Admin coupons], security: [{ bearerAuth: [] }], parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }], requestBody: { required: true, content: { application/json: { schema: { type: object, additionalProperties: false } } } }, responses: { 200: { description: Coupon updated } } }
 * /admin/coupons/{id}/status:
 *   patch: { summary: Enable or disable a coupon, tags: [Admin coupons], security: [{ bearerAuth: [] }], parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }], requestBody: { required: true, content: { application/json: { schema: { type: object, required: [isActive], properties: { isActive: { type: boolean } } } } } }, responses: { 200: { description: Coupon status updated } } }
 * /admin/coupons/{id}/usages:
 *   get: { summary: List successful coupon usages, tags: [Admin coupons], security: [{ bearerAuth: [] }], parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }], responses: { 200: { description: Coupon usages } } }
 */
couponRouter.post("/validate", authenticate, authorize("STUDENT"), validateRequest(validateCouponInput), asyncHandler(validateController));
adminCouponRouter.use(authenticate, authorize("ADMIN"));
adminCouponRouter.get("/", asyncHandler(listController)); adminCouponRouter.post("/", validateRequest(validateCreateCouponInput), asyncHandler(createController));
adminCouponRouter.get("/:id", asyncHandler(detailController)); adminCouponRouter.patch("/:id", validateRequest(validateUpdateCouponInput), asyncHandler(updateController)); adminCouponRouter.patch("/:id/status", validateRequest(validateCouponStatusInput), asyncHandler(statusController)); adminCouponRouter.get("/:id/usages", asyncHandler(usagesController));
