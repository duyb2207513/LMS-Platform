import { Router } from "express";
import authRouter from "../modules/auth/auth.routes.js";
import usersRouter from "../modules/users/users.routes.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/users", usersRouter);

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Check API health
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: LMS API is running
 *                 data:
 *                   type: object
 */
router.get("/health", (_request, response) => {
  response.status(200).json({
    success: true,
    message: "LMS API is running",
    data: {
      environment: process.env.NODE_ENV ?? "development",
      timestamp: new Date().toISOString()
    }
  });
});

export default router;
