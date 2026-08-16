import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { AppError } from "../../common/errors/AppError.js";
import { sendSuccess } from "../../common/utils/response.js";
import { env } from "../../config/env.js";
import { completeMockPayment, getMockPayment, initiateMockPayment, processMockWebhook } from "./payments.service.js";
import type { MockCallbackInput, MockWebhookInput } from "./payments.types.js";

const origin = (request: Request) => `${request.protocol}://${request.get("host")}`;
const p = (request: Request, key: string) => String(request.params[key] ?? "");

export async function initiateMockPaymentController(request: Request, response: Response) {
  sendSuccess(response, 201, "Mock payment initiated successfully", await initiateMockPayment(p(request, "orderId"), request.auth.userId, origin(request)));
}

export async function mockCheckoutController(request: Request, response: Response) {
  const payment = await getMockPayment(p(request, "paymentId"), String(request.query.token ?? ""));
  const token = encodeURIComponent(payment.idempotencyKey);
  const method = String(request.query.method ?? "MOCK").toUpperCase();
  const action = `/api/v1/payments/mock/${payment.id}/callback`;
  const amountFormatted = Number(payment.amount).toLocaleString("vi-VN");

  if (method === "MOMO") {
    // Sử dụng chuẩn VietQR chuyển khoản (MoMo & tất cả các ngân hàng đều quét và nhận diện tài khoản chính xác)
    const momoPhone = "0941014007"; // Số điện thoại MoMo cá nhân
    // Định dạng VietQR tĩnh cho MoMo (Ngân hàng nhận: MoMo / Napas)
    const qrUrl = `https://img.vietqr.io/image/momo-${momoPhone}-compact2.png?amount=${payment.amount}&addInfo=${encodeURIComponent(payment.order.orderNumber)}&accountName=${encodeURIComponent("LE DUC DUY")}`;

    response.type("html").send(`<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cổng thanh toán MoMo Sandbox</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f4f5f7; color: #222; display: flex; justify-content: center; align-items: center; min-h-screen; padding: 20px; }
    .momo-container { background: #fff; width: 100%; max-width: 440px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #eaeaea; }
    .momo-header { background: linear-gradient(135deg, #a50064, #d82d8b); color: white; padding: 24px 20px; text-align: center; }
    .momo-logo { width: 52px; height: 52px; background: white; border-radius: 12px; margin: 0 auto 12px; display: grid; place-items: center; font-weight: 900; color: #a50064; font-size: 22px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
    .momo-title { font-size: 18px; font-weight: 800; letter-spacing: -0.3px; }
    .momo-sub { font-size: 12px; opacity: 0.85; margin-top: 2px; }
    .momo-body { padding: 24px; text-align: center; }
    .amount-box { background: #fff0f6; border: 1px solid #fcc2d7; border-radius: 14px; padding: 14px; margin-bottom: 20px; }
    .amount-label { font-size: 12px; color: #a50064; font-weight: 700; text-transform: uppercase; }
    .amount-value { font-size: 28px; font-weight: 900; color: #a50064; margin-top: 2px; }
    .qr-frame { background: white; border: 2px border-dashed #d82d8b; border-radius: 16px; padding: 14px; display: inline-block; box-shadow: 0 8px 20px rgba(165,0,100,0.08); margin-bottom: 16px; }
    .qr-img { width: 200px; height: 200px; display: block; border-radius: 8px; }
    .scan-hint { font-size: 13px; font-weight: 600; color: #555; margin-bottom: 20px; }
    .info-list { text-align: left; font-size: 13px; background: #fafafa; border-radius: 12px; padding: 14px; margin-bottom: 24px; border: 1px solid #eee; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .info-row:last-child { margin-bottom: 0; }
    .info-label { color: #777; }
    .info-val { font-weight: 700; color: #222; }
    .btn-momo { width: 100%; border: none; border-radius: 12px; padding: 14px; font-weight: 800; font-size: 15px; cursor: pointer; transition: all 0.2s; }
    .btn-ok { background: #a50064; color: white; margin-bottom: 10px; box-shadow: 0 6px 16px rgba(165,0,100,0.25); }
    .btn-ok:hover { background: #880052; transform: translateY(-1px); }
    .btn-cancel { background: #f1f3f5; color: #495057; }
    .btn-cancel:hover { background: #e9ecef; }
  </style>
</head>
<body>
  <div class="momo-container">
    <div class="momo-header">
      <div class="momo-logo">momo</div>
      <div class="momo-title">Cổng Thanh Toán MoMo Sandbox</div>
      <div class="momo-sub">Hệ thống thử nghiệm thanh toán ví điện tử</div>
    </div>
    <div class="momo-body">
      <div class="amount-box">
        <div class="amount-label">Số tiền thanh toán</div>
        <div class="amount-value">${amountFormatted} VND</div>
      </div>

      <div class="qr-frame">
        <img class="qr-img" src="${qrUrl}" alt="MoMo QR Code" />
      </div>
      <p class="scan-hint">Mở ứng dụng Ví MoMo hoặc nhấn nút giả lập dưới đây</p>

      <div class="info-list">
        <div class="info-row"><span class="info-label">Nhà cung cấp:</span><span class="info-val">LMS Platform</span></div>
        <div class="info-row"><span class="info-label">Mã đơn hàng:</span><span class="info-val">${payment.order.orderNumber}</span></div>
        <div class="info-row"><span class="info-label">Loại giao dịch:</span><span class="info-val">Quét mã QR MoMo Sandbox</span></div>
      </div>

      <form method="post" action="${action}">
        <input type="hidden" name="token" value="${token}">
        <button type="submit" class="btn-momo btn-ok" name="status" value="SUCCEEDED">
          ✓ Giả lập xác nhận đã thanh toán
        </button>
        <button type="submit" class="btn-momo btn-cancel" name="status" value="FAILED">
          ✕ Hủy giao dịch MoMo
        </button>
      </form>
    </div>
  </div>
</body>
</html>`);
    return;
  }

  // Standard Mock Checkout
  response.type("html").send(`<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mock Payment Sandbox</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 480px; margin: 40px auto; padding: 24px; color: #1e293b; background: #f8fafc; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 28px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    h1 { font-size: 22px; font-weight: 800; margin-bottom: 6px; }
    p { font-size: 14px; color: #64748b; margin-bottom: 16px; }
    h2 { font-size: 28px; font-weight: 900; color: #6366f1; margin-bottom: 24px; }
    button { width: 100%; border: 0; border-radius: 12px; padding: 14px; margin-bottom: 10px; font-weight: 700; font-size: 15px; cursor: pointer; transition: all 0.2s; }
    .ok { background: #6366f1; color: #fff; box-shadow: 0 4px 12px rgba(99,102,241,0.25); }
    .ok:hover { background: #4f46e5; }
    .fail { background: #f1f5f9; color: #475569; }
    .fail:hover { background: #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Mock Payment Sandbox</h1>
    <p>Mã đơn hàng: <b>${payment.order.orderNumber}</b></p>
    <h2>${amountFormatted} ${payment.currency}</h2>
    <form method="post" action="${action}">
      <input type="hidden" name="token" value="${token}">
      <button class="ok" name="status" value="SUCCEEDED">Giả lập xác nhận đã thanh toán</button>
      <button class="fail" name="status" value="FAILED">Thanh toán thất bại</button>
    </form>
  </div>
</body>
</html>`);
}

export async function mockCallbackController(request: Request, response: Response) {
  const result = await completeMockPayment(p(request, "paymentId"), request.body as MockCallbackInput);

  // If request was submitted via browser Form POST, redirect back to Frontend Payment Result page
  const isFormSubmit = request.headers["content-type"]?.includes("application/x-www-form-urlencoded");
  if (isFormSubmit) {
    response.redirect(`${env.frontendUrl}/payment-result/${result.payment.orderId}`);
    return;
  }

  sendSuccess(response, 200, result.payment.status === "SUCCEEDED" ? "Payment completed successfully" : "Payment failed", result);
}

export async function mockWebhookController(request: Request, response: Response) {
  const received = String(request.headers["x-mock-signature"] ?? "");
  const expected = createHmac("sha256", env.mockPaymentWebhookSecret).update(JSON.stringify(request.body)).digest("hex");
  const a = Buffer.from(received);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new AppError(401, "Invalid webhook signature");
  }

  sendSuccess(response, 200, "Webhook processed successfully", await processMockWebhook(request.body as MockWebhookInput));
}
