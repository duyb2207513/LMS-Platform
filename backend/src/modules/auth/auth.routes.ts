import { Router } from "express";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { validateRequest } from "../../common/middlewares/validateRequest.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import {
  checkEmailExistsController,
  confirmEmailChangeController, forgotPasswordController, githubCallbackController, googleLoginController, listSessionsController,
  loginController, logoutController, mobileGoogleLoginController, mobileLoginController, mobileLogoutController,
  mobileOAuthExchangeController, mobileRefreshTokenController, refreshTokenController, registerController, resendVerificationController,
  requestEmailChangeController, resetPasswordController, revokeOtherSessionsController,
  revokeSessionController, startGitHubLoginController, verifyEmailController
} from "./auth.controller.js";
import {
  validateChangeEmailInput, validateEmailInput, validateGoogleLoginInput, validateLoginInput,
  validateMobileOAuthExchangeInput, validateMobileRefreshInput, validateRegisterInput, validateResetPasswordInput, validateTokenInput
} from "./auth.validation.js";

const authRouter = Router();

/** @openapi
 * /auth/check-email:
 *   get:
 *     tags: [Auth]
 *     summary: Check if email exists in database
 *     security: []
 *     parameters: [{ in: query, name: email, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Email availability checked } }
 */
authRouter.get("/check-email", asyncHandler(checkEmailExistsController));

/** @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new account and send an email verification link
 *     security: []
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/RegisterRequest' } } } }
 *     responses: { 201: { description: Account registered }, 409: { description: Email already exists } }
 */
authRouter.post("/register", validateRequest(validateRegisterInput), asyncHandler(registerController));
/** @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and create a revocable session
 *     security: []
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/LoginRequest' } } } }
 *     responses: { 200: { description: Login successful }, 401: { description: Invalid credentials }, 423: { description: Account temporarily locked } }
 */
authRouter.post("/login", validateRequest(validateLoginInput), asyncHandler(loginController));
/** @openapi
 * /auth/google:
 *   post:
 *     tags: [Auth]
 *     summary: Login with a Google ID token
 *     security: []
 *     requestBody: { required: true, content: { application/json: { schema: { type: object, required: [idToken], properties: { idToken: { type: string } } } } } }
 *     responses: { 200: { description: Google login successful }, 401: { description: Invalid Google token }, 503: { description: Google login is not configured } }
 */
authRouter.post("/google", validateRequest(validateGoogleLoginInput), asyncHandler(googleLoginController));
/** @openapi
 * /auth/mobile/login:
 *   post:
 *     tags: [Mobile auth]
 *     summary: Login from a native client and return both tokens in JSON
 *     security: []
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/LoginRequest' } } } }
 *     responses: { 200: { description: Mobile login successful }, 401: { description: Invalid credentials }, 423: { description: Account temporarily locked } }
 */
authRouter.post("/mobile/login", validateRequest(validateLoginInput), asyncHandler(mobileLoginController));
/** @openapi
 * /auth/mobile/google:
 *   post:
 *     tags: [Mobile auth]
 *     summary: Login from a native client using a Google ID token
 *     security: []
 *     requestBody: { required: true, content: { application/json: { schema: { type: object, required: [idToken], properties: { idToken: { type: string } } } } } }
 *     responses: { 200: { description: Mobile Google login successful }, 401: { description: Invalid Google token } }
 */
authRouter.post("/mobile/google", validateRequest(validateGoogleLoginInput), asyncHandler(mobileGoogleLoginController));
/** @openapi
 * /auth/mobile/oauth-exchange:
 *   post:
 *     tags: [Mobile auth]
 *     summary: Exchange a one-time OAuth handoff code for a native session
 *     security: []
 *     requestBody: { required: true, content: { application/json: { schema: { type: object, required: [code], properties: { code: { type: string } } } } } }
 *     responses: { 200: { description: OAuth login successful }, 401: { description: Code invalid or expired } }
 */
authRouter.post("/mobile/oauth-exchange", validateRequest(validateMobileOAuthExchangeInput), asyncHandler(mobileOAuthExchangeController));
/** @openapi
 * /auth/github:
 *   get:
 *     tags: [Auth]
 *     summary: Start GitHub OAuth login
 *     description: Creates a CSRF state cookie and redirects the browser to GitHub.
 *     security: []
 *     responses:
 *       302: { description: Redirect to GitHub authorization }
 *       503: { description: GitHub login is not configured }
 */
authRouter.get("/github", asyncHandler(startGitHubLoginController));
/** @openapi
 * /auth/github/callback:
 *   get:
 *     tags: [Auth]
 *     summary: Complete GitHub OAuth login
 *     description: Validates state, exchanges the code, creates a revocable LMS session, then redirects to the frontend.
 *     security: []
 *     parameters:
 *       - { in: query, name: code, schema: { type: string } }
 *       - { in: query, name: state, schema: { type: string } }
 *     responses:
 *       302: { description: Redirect to the frontend GitHub callback page }
 */
authRouter.get("/github/callback", asyncHandler(githubCallbackController));
/** @openapi
 * /auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate the refresh token and issue a new access token
 *     security: [{ refreshTokenCookie: [] }]
 *     responses: { 200: { description: Token refreshed }, 401: { description: Session missing, revoked, invalid, or expired } }
 */
authRouter.post("/refresh-token", asyncHandler(refreshTokenController));
/** @openapi
 * /auth/mobile/refresh-token:
 *   post:
 *     tags: [Mobile auth]
 *     summary: Rotate a native refresh token
 *     security: []
 *     requestBody: { required: true, content: { application/json: { schema: { type: object, required: [refreshToken], properties: { refreshToken: { type: string } } } } } }
 *     responses: { 200: { description: Tokens rotated }, 401: { description: Refresh token invalid, revoked, or expired } }
 */
authRouter.post("/mobile/refresh-token", validateRequest(validateMobileRefreshInput), asyncHandler(mobileRefreshTokenController));
/** @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke the current refresh-token session
 *     responses: { 200: { description: Logout successful } }
 */
authRouter.post("/logout", asyncHandler(logoutController));
/** @openapi
 * /auth/mobile/logout:
 *   post:
 *     tags: [Mobile auth]
 *     summary: Revoke a native refresh-token session
 *     security: []
 *     requestBody: { required: true, content: { application/json: { schema: { type: object, required: [refreshToken], properties: { refreshToken: { type: string } } } } } }
 *     responses: { 200: { description: Logout successful } }
 */
authRouter.post("/mobile/logout", validateRequest(validateMobileRefreshInput), asyncHandler(mobileLogoutController));

/** @openapi
 * /auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify an email using the one-time token
 *     security: []
 *     responses: { 200: { description: Email verified }, 400: { description: Token invalid or expired } }
 */
authRouter.post("/verify-email", validateRequest(validateTokenInput), asyncHandler(verifyEmailController));
/** @openapi
 * /auth/resend-verification:
 *   post:
 *     tags: [Auth]
 *     summary: Resend an email verification link without disclosing account existence
 *     security: []
 *     responses: { 200: { description: Request accepted } }
 */
authRouter.post("/resend-verification", validateRequest(validateEmailInput), asyncHandler(resendVerificationController));
/** @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset without disclosing account existence
 *     security: []
 *     responses: { 200: { description: Request accepted } }
 */
authRouter.post("/forgot-password", validateRequest(validateEmailInput), asyncHandler(forgotPasswordController));
/** @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using a one-time token and revoke all sessions
 *     security: []
 *     responses: { 200: { description: Password reset }, 400: { description: Token invalid or expired } }
 */
authRouter.post("/reset-password", validateRequest(validateResetPasswordInput), asyncHandler(resetPasswordController));
/** @openapi
 * /auth/change-email:
 *   post:
 *     tags: [Auth]
 *     summary: Send a confirmation link to a new email address
 *     responses: { 200: { description: Confirmation sent }, 409: { description: Email already exists } }
 */
authRouter.post("/change-email", authenticate, validateRequest(validateChangeEmailInput), asyncHandler(requestEmailChangeController));
/** @openapi
 * /auth/confirm-email-change:
 *   post:
 *     tags: [Auth]
 *     summary: Confirm a new email and revoke all sessions
 *     security: []
 *     responses: { 200: { description: Email changed }, 400: { description: Token invalid or expired } }
 */
authRouter.post("/confirm-email-change", validateRequest(validateTokenInput), asyncHandler(confirmEmailChangeController));

/** @openapi
 * /auth/sessions:
 *   get:
 *     tags: [Auth sessions]
 *     summary: List active login sessions for the current user
 *     responses: { 200: { description: Sessions retrieved } }
 */
authRouter.get("/sessions", authenticate, asyncHandler(listSessionsController));
/** @openapi
 * /auth/sessions/others:
 *   delete:
 *     tags: [Auth sessions]
 *     summary: Revoke every session except the current one
 *     responses: { 200: { description: Other sessions revoked } }
 */
authRouter.delete("/sessions/others", authenticate, asyncHandler(revokeOtherSessionsController));
/** @openapi
 * /auth/sessions/{sessionId}:
 *   delete:
 *     tags: [Auth sessions]
 *     summary: Revoke one session owned by the current user
 *     parameters: [{ in: path, name: sessionId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: Session revoked }, 404: { description: Session not found } }
 */
authRouter.delete("/sessions/:sessionId", authenticate, asyncHandler(revokeSessionController));

export default authRouter;
