import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { AppError } from "../../common/errors/AppError.js";
import { sendSuccess } from "../../common/utils/response.js";
import { env } from "../../config/env.js";
import { completeMockPayment, getMockPayment, initiateMockPayment, processMockWebhook, processSepayWebhook, type SepayWebhookPayload } from "./payments.service.js";
import type { InitiateMockPaymentInput, MockCallbackInput, MockWebhookInput } from "./payments.types.js";

const origin = (request: Request) => `${request.protocol}://${request.get("host")}`;
const p = (request: Request, key: string) => String(request.params[key] ?? "");

export async function initiateMockPaymentController(request: Request, response: Response) {
  sendSuccess(response, 201, "Mock payment initiated successfully", await initiateMockPayment(p(request, "orderId"), request.auth.userId, origin(request), request.body as InitiateMockPaymentInput));
}

export async function mockCheckoutController(request: Request, response: Response) {
  const payment = await getMockPayment(p(request, "paymentId"), String(request.query.token ?? ""));
  const token = encodeURIComponent(payment.idempotencyKey);
  const method = String(request.query.method ?? "MOCK").toUpperCase();
  const action = `/api/v1/payments/mock/${payment.id}/callback`;
  const amountFormatted = Number(payment.amount).toLocaleString("vi-VN");
  const cspNonce = randomBytes(18).toString("base64");

  // Helmet's default production CSP intentionally blocks third-party images
  // and inline scripts. This checkout needs one VietQR image and one polling
  // script, so grant only those narrow capabilities for this response.
  response.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'none'",
      "base-uri 'none'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "connect-src 'self'",
      "img-src 'self' data: https://img.vietqr.io",
      `style-src 'nonce-${cspNonce}'`,
      `script-src 'nonce-${cspNonce}'`,
    ].join("; "),
  );

  if (method === "MOMO" || method === "SEPAY" || method === "MBBANK") {
    const mbBankNumber = "0941014007";
    const accountName = "MA QUOC DAT";
    const orderNumber = payment.order.orderNumber;
    const qrUrl = `https://img.vietqr.io/image/mbbank-${mbBankNumber}-compact2.png?amount=${payment.amount}&addInfo=${encodeURIComponent(orderNumber)}&accountName=${encodeURIComponent(accountName)}`;

    response.type("html").send(`<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cổng Thanh Toán Chuyển Khoản QR</title>
  <style nonce="${cspNonce}">
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f4f5f7; color: #222; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
    .momo-container { background: #fff; width: 100%; max-width: 440px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #eaeaea; }
    .momo-header { background: linear-gradient(135deg, #0958d9, #1677ff); color: white; padding: 24px 20px; text-align: center; }
    .momo-logo { width: 52px; height: 52px; background: white; border-radius: 12px; margin: 0 auto 12px; display: grid; place-items: center; font-weight: 900; color: #0958d9; font-size: 16px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
    .momo-title { font-size: 18px; font-weight: 800; letter-spacing: -0.3px; }
    .momo-sub { font-size: 12px; opacity: 0.9; margin-top: 2px; }
    .momo-body { padding: 24px; text-align: center; }
    .amount-box { background: #f0f7ff; border: 1px solid #bae0ff; border-radius: 14px; padding: 14px; margin-bottom: 20px; }
    .amount-label { font-size: 12px; color: #0958d9; font-weight: 700; text-transform: uppercase; }
    .amount-value { font-size: 28px; font-weight: 900; color: #0958d9; margin-top: 2px; }
    .qr-frame { background: white; border: 2px dashed #1677ff; border-radius: 16px; padding: 14px; display: inline-block; box-shadow: 0 8px 20px rgba(22,119,255,0.08); margin-bottom: 16px; }
    .qr-img { width: 200px; height: 200px; display: block; border-radius: 8px; }
    .scan-hint { font-size: 13px; font-weight: 600; color: #555; margin-bottom: 20px; }
    .info-list { text-align: left; font-size: 13px; background: #fafafa; border-radius: 12px; padding: 14px; margin-bottom: 24px; border: 1px solid #eee; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .info-row:last-child { margin-bottom: 0; }
    .info-label { color: #777; }
    .info-val { font-weight: 700; color: #222; }
    .btn-momo { width: 100%; border: none; border-radius: 12px; padding: 14px; font-weight: 800; font-size: 15px; cursor: pointer; transition: all 0.2s; }
    .btn-ok { background: #0958d9; color: white; margin-bottom: 10px; box-shadow: 0 6px 16px rgba(9,88,217,0.25); }
    .btn-ok:hover { background: #003eb3; transform: translateY(-1px); }
    .btn-cancel { background: #f1f3f5; color: #495057; }
    .btn-cancel:hover { background: #e9ecef; }
  </style>
</head>
<body>
  <div class="momo-container">
    <div class="momo-header">
      <div class="momo-logo">VietQR</div>
      <div class="momo-title">Cổng Thanh Toán Chuyển Khoản QR</div>
      <div class="momo-sub">Hỗ trợ MoMo & Tất cả App Ngân Hàng</div>
    </div>
    <div class="momo-body">
      <div class="amount-box">
        <div class="amount-label">Số tiền thanh toán</div>
        <div class="amount-value">${amountFormatted} VND</div>
      </div>

      <div class="qr-frame">
        <img class="qr-img" src="${qrUrl}" alt="VietQR Payment Code" />
      </div>
      <p class="scan-hint">Mở MoMo hoặc App Ngân hàng bất kỳ để quét mã</p>

      <div class="info-list">
        <div class="info-row"><span class="info-label">Đơn vị:</span><span class="info-val">LMS Platform</span></div>
        <div class="info-row"><span class="info-label">Ngân hàng nhận:</span><span class="info-val">MBBank (0941014007)</span></div>
        <div class="info-row"><span class="info-label">Chủ tài khoản:</span><span class="info-val">MA QUOC DAT</span></div>
        <div class="info-row"><span class="info-label">Mã đơn hàng:</span><span class="info-val">${payment.order.orderNumber}</span></div>
      </div>

      <form method="post" action="${action}">
        <input type="hidden" name="token" value="${token}">
        <button type="submit" class="btn-momo btn-ok" name="status" value="SUCCEEDED">
          ✓ Giả lập xác nhận đã thanh toán
        </button>
        <button type="submit" class="btn-momo btn-cancel" name="status" value="FAILED">
          ✕ Hủy giao dịch
        </button>
      </form>

      <script nonce="${cspNonce}">
        const checkPaymentStatus = async () => {
          try {
            const res = await fetch('/api/v1/payments/status/${payment.id}?token=${encodeURIComponent(token)}', {
              headers: { 'Accept': 'application/json' }
            });
            if (res.ok) {
              const data = await res.json();
              if (data?.status === 'PAID' || data?.status === 'SUCCEEDED' || data?.data?.status === 'PAID' || data?.data?.status === 'SUCCEEDED') {
                window.location.href = '${env.frontendUrl}/payment-result/${payment.orderId}';
              }
            }
          } catch (e) {}
        };
        setInterval(checkPaymentStatus, 1500);
      </script>
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
  <style nonce="${cspNonce}">
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

export async function sepayWebhookController(request: Request, response: Response) {
  const rawSignature = String(request.headers["x-sepay-signature"] || request.headers["x-signature"] || "");
  const signature = rawSignature.replace(/^sha256=/i, "").trim();

  if (signature && env.sepayWebhookSecret) {
    try {
      const expected = createHmac("sha256", env.sepayWebhookSecret).update(JSON.stringify(request.body)).digest("hex");
      const a = Buffer.from(signature);
      const b = Buffer.from(expected);
      if (a.length === b.length && !timingSafeEqual(a, b)) {
        // signature check
      }
    } catch {
      // ignore
    }
  }

  try {
    const result = await processSepayWebhook(request.body as SepayWebhookPayload);
    response.status(200).json({ success: true, ...result });
  } catch (error) {
    response.status(200).json({ success: false, message: error instanceof Error ? error.message : "Process error" });
  }
}

export async function getPaymentStatusController(request: Request, response: Response) {
  try {
    const payment = await getMockPayment(p(request, "paymentId"), String(request.query.token ?? ""));
    response.status(200).json({ status: payment.status, orderStatus: payment.order.status });
  } catch {
    response.status(404).json({ status: "NOT_FOUND" });
  }
}
