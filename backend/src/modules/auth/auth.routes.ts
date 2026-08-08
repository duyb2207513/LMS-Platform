import { Router } from "express";
import { validateRequest } from "../../common/middlewares/validateRequest.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { loginController, registerController } from "./auth.controller.js";
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

export default authRouter;
