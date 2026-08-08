import { Router } from "express";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { getMyProfileController } from "./users.controller.js";

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

export default usersRouter;
