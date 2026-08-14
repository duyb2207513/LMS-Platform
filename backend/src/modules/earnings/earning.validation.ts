import { AppError } from "../../common/errors/AppError.js";
import { parseDateRange } from "../analytics/analytics.date.js";
import type { RevenueQuery } from "./earning.types.js";
export function parseRevenueQuery(query: Record<string, unknown>): RevenueQuery { const range = parseDateRange(query); const page = Number(query.page ?? 1), limit = Number(query.limit ?? 20); if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new AppError(400, "Invalid pagination"); const status = query.status; if (status !== undefined && !["PENDING", "AVAILABLE", "PAID", "REVERSED"].includes(String(status))) throw new AppError(400, "Invalid earning status"); return { ...range, page, limit, ...(status ? { status: status as RevenueQuery["status"] } : {}) }; }
