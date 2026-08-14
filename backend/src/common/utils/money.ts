import { AppError } from "../errors/AppError.js";

export interface PricingBreakdown {
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  currency: "VND";
}

export function toVnd(value: unknown, field = "amount"): bigint {
  const text = String(value);
  if (!/^\d+(?:\.0+)?$/.test(text)) throw new AppError(500, `${field} must be stored as a whole VND amount`);
  const amount = BigInt(text.split(".")[0]!);
  if (amount > BigInt(Number.MAX_SAFE_INTEGER)) throw new AppError(500, `${field} exceeds the supported VND range`);
  return amount;
}

export function vndNumber(value: bigint): number {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) throw new AppError(500, "Money amount exceeds the supported VND range");
  return Number(value);
}

export function calculateDiscount(
  original: bigint,
  type: "PERCENTAGE" | "FIXED_AMOUNT",
  discountValue: bigint,
  maxDiscountAmount?: bigint | null
): bigint {
  if (original < 0n || discountValue <= 0n) throw new AppError(500, "Invalid money calculation input");
  let discount = type === "PERCENTAGE" ? original * discountValue / 100n : discountValue;
  if (maxDiscountAmount !== undefined && maxDiscountAmount !== null && discount > maxDiscountAmount) discount = maxDiscountAmount;
  return discount > original ? original : discount;
}

export function pricing(original: bigint, discount: bigint): PricingBreakdown {
  return { originalAmount: vndNumber(original), discountAmount: vndNumber(discount), finalAmount: vndNumber(original - discount), currency: "VND" };
}

export function calculateEarning(gross: bigint, platformFeeRatePercent: number) {
  if (!Number.isInteger(platformFeeRatePercent) || platformFeeRatePercent < 0 || platformFeeRatePercent > 100) throw new AppError(500, "Invalid platform fee rate");
  const platformFee = gross * BigInt(platformFeeRatePercent) / 100n;
  return { grossAmount: vndNumber(gross), platformFeeAmount: vndNumber(platformFee), netAmount: vndNumber(gross - platformFee) };
}

export function allocateDiscount(amounts: bigint[], discount: bigint): bigint[] {
  const total = amounts.reduce((sum, value) => sum + value, 0n);
  if (!amounts.length || total === 0n) return amounts.map(() => 0n);
  let allocated = 0n;
  return amounts.map((amount, index) => {
    const value = index === amounts.length - 1 ? discount - allocated : discount * amount / total;
    allocated += value;
    return value;
  });
}
