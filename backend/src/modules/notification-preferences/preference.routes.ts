import { Router } from "express";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { validateRequest } from "../../common/middlewares/validateRequest.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { getPreferencesController, updatePreferencesController } from "./preference.controller.js";
import { validatePreferenceInput } from "./preference.validation.js";
const router = Router();
/**
 * @openapi
 * /notification-preferences:
 *   get:
 *     summary: Get current user's notification preferences
 *     tags: [Notification preferences]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Preferences retrieved } }
 *   patch:
 *     summary: Partially update current user's notification preferences
 *     tags: [Notification preferences]
 *     security: [{ bearerAuth: [] }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/NotificationPreferenceRequest' } } } }
 *     responses: { 200: { description: Preferences updated }, 400: { description: Boolean fields are required } }
 */
router.get("/", authenticate, asyncHandler(getPreferencesController));
router.patch("/", authenticate, validateRequest(validatePreferenceInput), asyncHandler(updatePreferencesController));
export default router;
