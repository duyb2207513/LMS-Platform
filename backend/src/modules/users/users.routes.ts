import { Router } from "express";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { uploadAvatar } from "../../config/upload.js";
import { validateRequest } from "../../common/middlewares/validateRequest.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import {
  changeMyPasswordController,
  deleteMyAvatarController,
  getMyProfileController,
  uploadMyAvatarController,
  updateMyProfileController
} from "./users.controller.js";
import {
  validateChangePasswordInput,
  validateUpdateProfileInput
} from "./users.validation.js";

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

/**
 * @openapi
 * /users/me/avatar:
 *   post:
 *     operationId: uploadMyAvatar
 *     summary: Upload the authenticated user's avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [avatar]
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *           encoding:
 *             avatar:
 *               contentType: image/jpeg, image/png, image/webp
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfileResponse'
 *       400:
 *         description: File is missing, invalid, or larger than 5 MB
 *       401:
 *         description: Authentication required
 *   delete:
 *     operationId: deleteMyAvatar
 *     summary: Remove the authenticated user's avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfileResponse'
 *       401:
 *         description: Authentication required
 */
usersRouter.post("/me/avatar", authenticate, uploadAvatar, asyncHandler(uploadMyAvatarController));
usersRouter.delete("/me/avatar", authenticate, asyncHandler(deleteMyAvatarController));

/**
 * @openapi
 * /users/me/password:
 *   patch:
 *     operationId: changeMyPassword
 *     summary: Change the authenticated user's password
 *     description: Verifies the current password, hashes the new password with bcrypt, and updates only the user identified by the access token.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *           example:
 *             currentPassword: Password123
 *             newPassword: NewPassword456
 *             confirmNewPassword: NewPassword456
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChangePasswordResponse'
 *       400:
 *         description: Password input is invalid or the current password is incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
  "/me/password",
  authenticate,
  validateRequest(validateChangePasswordInput),
  asyncHandler(changeMyPasswordController)
);

export default usersRouter;
