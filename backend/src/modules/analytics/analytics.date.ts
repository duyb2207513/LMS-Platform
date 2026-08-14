import { AppError } from "../../common/errors/AppError.js";
import type { AnalyticsDateRange, AnalyticsGroupBy } from "./analytics.types.js";

export const ANALYTICS_TIMEZONE = "Asia/Ho_Chi_Minh";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

export function dateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ANALYTICS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function shiftDateKey(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function assertDateKey(value: unknown, field: string): string {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) throw new AppError(400, `${field} must use YYYY-MM-DD format`);
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new AppError(400, `${field} must be a valid date`);
  return value;
}

export function localDateStart(value: string): Date {
  return new Date(`${value}T00:00:00.000+07:00`);
}

export function parseDateRange(query: Record<string, unknown>, defaultGroupBy: AnalyticsGroupBy = "day"): AnalyticsDateRange {
  const today = dateKey(new Date());
  const from = query.from === undefined ? shiftDateKey(today, -29) : assertDateKey(query.from, "from");
  const to = query.to === undefined ? today : assertDateKey(query.to, "to");
  if (from > to) throw new AppError(400, "from must not be after to");
  const inclusiveDays = Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS) + 1;
  if (inclusiveDays > 365) throw new AppError(400, "Date range must not exceed 365 days");
  const groupBy = query.groupBy === undefined ? defaultGroupBy : query.groupBy;
  if (groupBy !== "day" && groupBy !== "week" && groupBy !== "month") throw new AppError(400, "groupBy must be day, week, or month");
  return { from, to, fromDate: localDateStart(from), toExclusive: localDateStart(shiftDateKey(to, 1)), groupBy };
}

export function bucketKey(value: string, groupBy: AnalyticsGroupBy): string {
  if (groupBy === "day") return value;
  if (groupBy === "month") return `${value.slice(0, 7)}-01`;
  const date = new Date(`${value}T00:00:00.000Z`);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  return shiftDateKey(value, -daysSinceMonday);
}

export function buildBucketKeys(from: string, to: string, groupBy: AnalyticsGroupBy): string[] {
  const keys = new Set<string>();
  for (let value = from; value <= to; value = shiftDateKey(value, 1)) keys.add(bucketKey(value, groupBy));
  return [...keys];
}

export function calculateStreak(activeDateKeys: Iterable<string>, today = dateKey(new Date())): { currentStreakDays: number; longestStreakDays: number } {
  const dates = [...new Set(activeDateKeys)].sort();
  if (!dates.length) return { currentStreakDays: 0, longestStreakDays: 0 };

  let longest = 1, running = 1;
  for (let index = 1; index < dates.length; index += 1) {
    running = dates[index] === shiftDateKey(dates[index - 1]!, 1) ? running + 1 : 1;
    longest = Math.max(longest, running);
  }

  const active = new Set(dates);
  let cursor = active.has(today) ? today : shiftDateKey(today, -1);
  let current = 0;
  while (active.has(cursor)) {
    current += 1;
    cursor = shiftDateKey(cursor, -1);
  }
  return { currentStreakDays: current, longestStreakDays: longest };
}
