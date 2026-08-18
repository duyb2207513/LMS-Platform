import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { verifyAccessToken } from "../auth/auth.tokens.js";
import { chatWithAiController } from "./ai.controller.js";

const optionalAuthenticate = (req: any, _res: any, next: any) => {
  const authorization = req.headers.authorization;
  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice("Bearer ".length).trim();
    if (token) {
      try {
        req.auth = verifyAccessToken(token);
      } catch {
        // Bỏ qua lỗi token đối với khách vãng lai
      }
    }
  }
  next();
};

const aiRouter = Router();

aiRouter.post("/chat", optionalAuthenticate, asyncHandler(chatWithAiController));

export default aiRouter;
