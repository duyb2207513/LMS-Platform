import { Router } from "express";
import { validateRequest } from "../../common/middlewares/validateRequest.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import {
  loginController,
  logoutController,
  refreshTokenController,
  registerController
} from "./auth.controller.js";
import { validateLoginInput, validateRegisterInput } from "./auth.validation.js";

const authRouter = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     operationId: registerAccount
 *     summary: Register a new student account
 *     description: Creates an active student account. The email is normalized to lowercase and the client cannot set a role.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             fullName: Trần Minh Duy
 *             email: duy@example.com
 *             password: Password123
 *             confirmPassword: Password123
 *     responses:
 *       201:
 *         description: Account registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [success, message, data]
 *               properties:
 *                 success: { type: boolean, enum: [true], example: true }
 *                 message: { type: string, example: Account registered successfully }
 *                 data:
 *                   type: object
 *                   required: [user]
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Registration data is invalid or the client supplied a role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Validation failed
 *               errors:
 *                 password: Password must contain an uppercase letter, a lowercase letter, and a number
 *       409:
 *         description: An account with this email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Email already exists
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Internal server error
 */
authRouter.post(
  "/register",
  validateRequest(validateRegisterInput),
  asyncHandler(registerController)
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     operationId: login
 *     summary: Log in to an account
 *     description: Returns a 15-minute access token and sets a seven-day refresh token in a secure HttpOnly cookie.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: duy@example.com
 *             password: Password123
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             description: Secure HttpOnly refresh-token cookie
 *             schema: { type: string }
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Email or password is missing or invalid
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Email or password is incorrect
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, message: Invalid email or password }
 *       403:
 *         description: Account is blocked
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
authRouter.post(
  "/login",
  validateRequest(validateLoginInput),
  asyncHandler(loginController)
);

/**
 * @openapi
 * /auth/refresh-token:
 *   post:
 *     operationId: refreshAccessToken
 *     summary: Refresh the access token
 *     description: Uses the refresh token cookie to issue a new 15-minute access token. No request body is required.
 *     tags: [Auth]
 *     security:
 *       - refreshTokenCookie: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RefreshTokenResponse' }
 *       401:
 *         description: Refresh token is missing, invalid, or expired
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
authRouter.post("/refresh-token", asyncHandler(refreshTokenController));

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     operationId: logout
 *     summary: Log out of the current account
 *     description: Clears the refresh-token cookie. No request body is required.
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         headers:
 *           Set-Cookie:
 *             description: Expired refresh-token cookie
 *             schema: { type: string }
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/LogoutResponse' }
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
authRouter.post("/logout", asyncHandler(logoutController));

export default authRouter;
