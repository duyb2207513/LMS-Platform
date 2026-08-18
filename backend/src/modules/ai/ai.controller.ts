import type { Request, Response } from "express";
import { AppError } from "../../common/errors/AppError.js";
import { sendSuccess } from "../../common/utils/response.js";
import { askGeminiAgent } from "./ai.service.js";
import type { AiChatRequest } from "./ai.types.js";

export async function chatWithAiController(request: Request, response: Response) {
  const body = (request.body || {}) as AiChatRequest;
  const message = String(body.message || "").trim();

  if (!message) {
    throw new AppError(400, "Nội dung tin nhắn không được để trống");
  }

  if (message.length > 4000) {
    throw new AppError(400, "Tin nhắn không được vượt quá 4000 ký tự");
  }

  const history = Array.isArray(body.history) ? body.history : [];
  const courseId = body.courseId ? String(body.courseId) : undefined;
  const currentUserId = request.auth?.userId;

  const result = await askGeminiAgent(message, history, courseId, currentUserId);

  sendSuccess(response, 200, "AI phản hồi thành công", result);
}
