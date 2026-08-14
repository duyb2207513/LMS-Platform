import type { RequestHandler } from "express";
import { writeAuditLog } from "../utils/audit.js";

export const auditTrail: RequestHandler = (request, response, next) => {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) return next();
  response.on("finish", () => {
    if (response.statusCode >= 400 || request.path.includes("refresh-token")) return;
    void writeAuditLog({
      actorUserId: request.auth?.userId,
      action: `${request.method} ${request.baseUrl}${request.path}`.slice(0, 100),
      entityType: "HTTP_REQUEST",
      metadata: { statusCode: response.statusCode },
      request
    });
  });
  next();
};
