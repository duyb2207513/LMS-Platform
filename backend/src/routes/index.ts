import { Router } from "express";

const router = Router();

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