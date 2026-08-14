import type { Request } from "express";
import { prisma } from "../../config/database.js";
import { logger } from "../../config/logger.js";

export type AuditContext = Pick<Request, "ip"> & { headers: Request["headers"] };

export async function writeAuditLog(input: {
  actorUserId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  request?: AuditContext;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId || null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        ipAddress: input.request?.ip,
        userAgent: input.request?.headers["user-agent"]?.slice(0, 500),
        metadata: input.metadata as never
      }
    });
  } catch (error) {
    logger.error({ err: error, action: input.action }, "Could not persist audit log");
  }
}
