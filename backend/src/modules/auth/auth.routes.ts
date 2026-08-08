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
 *     description: Authenticates an active account and sets a seven-day refresh token in an HttpOnly cookie.
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
 *         description: Login successful. The refresh token is returned in a secure HttpOnly cookie.
 *         headers:
 *           Set-Cookie:
 *             description: Seven-day refresh token cookie
 *             schema:
 *               type: string
 *               example: refreshToken=token; Path=/api/v1/auth; HttpOnly; Secure; SameSite=Lax
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Email or password is missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Email or password is incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Invalid email or password
 *       403:
 *         description: The account is blocked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Account is blocked
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *     description: Issues a new 15-minute access token using the seven-day refresh token stored in an HttpOnly cookie. No request body is required.
 *     tags: [Auth]
 *     security:
 *       - refreshTokenCookie: []
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshTokenResponse'
 *       401:
 *         description: The refresh token cookie is missing, invalid, expired, or belongs to an unavailable account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingCookie:
 *                 summary: Cookie is missing
 *                 value:
 *                   success: false
 *                   message: Refresh token is required
 *               invalidToken:
 *                 summary: Token is invalid or expired
 *                 value:
 *                   success: false
 *                   message: Invalid or expired refresh token
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
authRouter.post("/refresh-token", asyncHandler(refreshTokenController));

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     operationId: logout
 *     summary: Log out of the current account
 *     description: Clears the secure HttpOnly refresh-token cookie. The endpoint is idempotent and does not require a request body.
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: Logout successful and the refresh-token cookie has been cleared
 *         headers:
 *           Set-Cookie:
 *             description: Expired refresh-token cookie
 *             schema:
 *               type: string
 *               example: refreshToken=; Path=/api/v1/auth; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutResponse'
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
authRouter.post("/logout", asyncHandler(logoutController));

export default authRouter;
