import type { Request, Response } from "express";
import { sendSuccess } from "../../common/utils/response.js";
import { createCoupon, getCoupon, listCoupons, listCouponUsages, setCouponStatus, updateCoupon, validateCoupon } from "./coupon.service.js";
import type { CouponInput, CouponStatusInput, CouponUpdateInput, ValidateCouponInput } from "./coupon.types.js";
const id = (request: Request) => String(request.params.id ?? "");
export async function validateController(request: Request, response: Response) { sendSuccess(response, 200, "Coupon validated successfully", await validateCoupon(request.auth.userId, request.body as ValidateCouponInput)); }
export async function createController(request: Request, response: Response) { sendSuccess(response, 201, "Coupon created successfully", await createCoupon(request.auth.userId, request.body as CouponInput)); }
export async function listController(request: Request, response: Response) { const result = await listCoupons(request.query); response.status(200).json({ success: true, message: "Coupons retrieved successfully", ...result }); }
export async function detailController(request: Request, response: Response) { sendSuccess(response, 200, "Coupon retrieved successfully", await getCoupon(id(request))); }
export async function updateController(request: Request, response: Response) { sendSuccess(response, 200, "Coupon updated successfully", await updateCoupon(id(request), request.body as CouponUpdateInput)); }
export async function statusController(request: Request, response: Response) { sendSuccess(response, 200, "Coupon status updated successfully", await setCouponStatus(id(request), request.body as CouponStatusInput)); }
export async function usagesController(request: Request, response: Response) { sendSuccess(response, 200, "Coupon usages retrieved successfully", await listCouponUsages(id(request))); }
