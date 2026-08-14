import assert from "node:assert/strict";
import { allocateDiscount, calculateDiscount, calculateEarning, pricing, toVnd } from "../../dist/common/utils/money.js";
import { validateCreateCouponInput, validateCouponInput } from "../../dist/modules/coupons/coupon.validation.js";
import { validateCreateRefund } from "../../dist/modules/refunds/refund.validation.js";

assert.equal(calculateDiscount(1_000_000n, "PERCENTAGE", 20n), 200_000n);
assert.equal(calculateDiscount(1_000_000n, "PERCENTAGE", 50n, 300_000n), 300_000n);
assert.equal(calculateDiscount(100_000n, "FIXED_AMOUNT", 200_000n), 100_000n);
assert.deepEqual(pricing(1_000_000n, 200_000n), { originalAmount: 1_000_000, discountAmount: 200_000, finalAmount: 800_000, currency: "VND" });
assert.deepEqual(calculateEarning(800_000n, 20), { grossAmount: 800_000, platformFeeAmount: 160_000, netAmount: 640_000 });
assert.deepEqual(allocateDiscount([300_000n, 700_000n], 200_000n), [60_000n, 140_000n]);
assert.equal(toVnd("299000.00"), 299000n);
assert.throws(() => toVnd("10.50"));

const courseId = "10000000-0000-4000-8000-000000000001";
const valid = validateCreateCouponInput({ code: "welcome20", name: "Welcome", discountType: "PERCENTAGE", discountValue: 20, startsAt: "2026-08-01T00:00:00.000Z", expiresAt: "2026-09-01T00:00:00.000Z", appliesToAllCourses: false, courseIds: [courseId], isActive: true });
assert.equal(valid.data.discountValue, 20);
assert.ok(validateCreateCouponInput({ code: "x", name: "x", discountType: "PERCENTAGE", discountValue: 101, startsAt: "2026-09-01T00:00:00.000Z", expiresAt: "2026-08-01T00:00:00.000Z", appliesToAllCourses: false, courseIds: [], isActive: true }).errors.discountValue);
assert.ok(validateCouponInput({ code: "WELCOME20", courseId: "bad" }).errors.courseId);
assert.ok(validateCreateRefund({ orderId: courseId, reason: "short" }).errors.reason);
assert.equal(validateCreateRefund({ orderId: courseId, reason: "The course does not fit my learning goals." }).data.orderId, courseId);
console.log("Sprint 10 commerce money and validation tests passed");
