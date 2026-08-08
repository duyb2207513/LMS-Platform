import { Router } from "express";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { validateRequest } from "../../common/middlewares/validateRequest.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import {
  getMyProfileController,
  updateMyProfileController
} from "./users.controller.js";
import { validateUpdateProfileInput } from "./users.validation.js";

const usersRouter = Router();

/**
 * @openapi
 * /users/me:
 *   get:
 *     operationId: getMyProfile
 *     summary: Get the authenticated user's profile
 *     description: Returns only the profile belonging to the userId in the access token. No userId parameter is accepted.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfileResponse'
 *       401:
 *         description: Access token is missing, invalid, or expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Authentication required
 *       404:
 *         description: The user referenced by the token no longer exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
usersRouter.get("/me", authenticate, asyncHandler(getMyProfileController));

/**
 * @openapi
 * /users/me:
 *   patch:
 *     operationId: updateMyProfile
 *     summary: Update the authenticated user's profile
 *     description: Updates only fullName and avatarUrl for the userId in the access token. Role, status, password, email, and arbitrary fields are rejected.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *           example:
 *             fullName: Trần Minh Duy Updated
 *             avatarUrl: https://example.com/avatar.jpg
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateProfileResponse'
 *       400:
 *         description: Profile data is invalid or contains a forbidden field
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Validation failed
 *               errors:
 *                 role: role cannot be updated through this endpoint
 *       401:
 *         description: Access token is missing, invalid, or expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: The user referenced by the token no longer exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
usersRouter.patch(
  "/me",
  authenticate,
  validateRequest(validateUpdateProfileInput),
  asyncHandler(updateMyProfileController)
);

export default usersRouter;
