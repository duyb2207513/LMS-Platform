import nodemailer from "nodemailer";
import { env } from "./env.js";
import { logger } from "./logger.js";

const transporter = env.smtpHost
  ? nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPassword } : undefined
    })
  : nodemailer.createTransport({ jsonTransport: true });

export function sendMailMessage(input: { to: string; subject: string; text: string; html?: string }) {
  if (env.nodeEnv === "production" && !env.smtpHost) throw new Error("SMTP is not configured");
  return transporter.sendMail({ from: env.mailFrom, ...input });
}

async function sendActionEmail(to: string, subject: string, heading: string, description: string, actionUrl: string, actionLabel: string) {
  await sendMailMessage({
    to,
    subject,
    text: `${heading}\n\n${description}\n\n${actionUrl}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#111827"><h1 style="font-size:24px">${heading}</h1><p style="line-height:1.7;color:#4b5563">${description}</p><p style="margin:28px 0"><a href="${actionUrl}" style="background:#7c3aed;color:white;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700">${actionLabel}</a></p><p style="font-size:12px;color:#9ca3af">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.</p></div>`
  });
  if (!env.smtpHost && env.nodeEnv !== "production") logger.info({ to, actionUrl }, "Development email generated");
}

function buildActionUrl(baseUrl: string, path: string, token: string) {
  const separator = baseUrl.endsWith("/") ? "" : "/";
  return `${baseUrl}${separator}${path}?token=${encodeURIComponent(token)}`;
}

export const sendVerificationEmail = (to: string, token: string, baseUrl = env.frontendUrl) => sendActionEmail(to, "Xác minh email LMS Platform", "Xác minh địa chỉ email", "Hoàn tất xác minh để bảo vệ tài khoản LMS Platform của bạn.", buildActionUrl(baseUrl, "verify-email", token), "Xác minh email");
export const sendPasswordResetEmail = (to: string, token: string, baseUrl = env.frontendUrl) => sendActionEmail(to, "Đặt lại mật khẩu LMS Platform", "Đặt lại mật khẩu", "Liên kết này có hiệu lực trong 30 phút.", buildActionUrl(baseUrl, "reset-password", token), "Đặt lại mật khẩu");
export const sendEmailChangeEmail = (to: string, token: string, baseUrl = env.frontendUrl) => sendActionEmail(to, "Xác nhận email mới LMS Platform", "Xác nhận email mới", "Nhấn nút bên dưới để chuyển tài khoản sang địa chỉ email này.", buildActionUrl(baseUrl, "confirm-email-change", token), "Xác nhận email mới");
