# Sprint 6 — Hoàn thiện hệ thống thực tế

## 1. Mục tiêu

Sprint 6 nâng hệ thống từ bản demo thành nền tảng gần với sản phẩm thực tế hơn: authentication nâng cao, quản lý phiên đăng nhập, bảo mật, audit log, logging, CI/CD, health check và backup database.

## 2. Trạng thái triển khai

| Thành phần | Trạng thái | Phạm vi |
| --- | --- | --- |
| Backend | Đã có | Email verification, reset password, Google/GitHub OAuth, đổi email, session rotation/revocation, khóa tạm tài khoản, audit và logging |
| Web | Đã có | Quên/đặt lại mật khẩu, xác minh email, đổi email, callback GitHub, trang Bảo mật và thiết bị |
| Mobile | Một phần | Vẫn dùng register/login/refresh/logout; chưa có đầy đủ màn hình auth nâng cao của Sprint 6 |
| DevOps | Đã có | CI, production Compose, health/readiness, backup script và deploy tùy chọn |

## 3. Thay đổi database

### `users`

Các trường phục vụ authentication nâng cao:

- `google_id`, `github_id`: liên kết tài khoản OAuth.
- `email_verified_at`: thời điểm xác minh email.
- `failed_login_attempts`: số lần đăng nhập sai liên tiếp.
- `locked_until`: thời điểm mở khóa tự động.
- `last_login_at`: lần đăng nhập gần nhất.

### Bảng mới

- `auth_sessions`: lưu hash refresh token, IP, user-agent, thời hạn và thời điểm thu hồi.
- `auth_tokens`: token một lần cho xác minh email, reset mật khẩu và đổi email; chỉ lưu hash token.
- `audit_logs`: lưu actor, hành động, tài nguyên, IP, user-agent và metadata của hành động quan trọng.

Refresh token và token xác nhận không được lưu dạng rõ trong database.

## 4. API authentication nâng cao

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| `POST` | `/api/v1/auth/verify-email` | Xác minh email bằng token một lần |
| `POST` | `/api/v1/auth/resend-verification` | Gửi lại liên kết xác minh |
| `POST` | `/api/v1/auth/forgot-password` | Yêu cầu liên kết đặt lại mật khẩu |
| `POST` | `/api/v1/auth/reset-password` | Đặt mật khẩu mới bằng token |
| `POST` | `/api/v1/auth/google` | Đăng nhập bằng Google ID token |
| `GET` | `/api/v1/auth/github` | Bắt đầu GitHub Authorization Code flow |
| `GET` | `/api/v1/auth/github/callback` | Nhận callback từ GitHub |
| `POST` | `/api/v1/auth/change-email` | Gửi liên kết xác nhận tới email mới |
| `POST` | `/api/v1/auth/confirm-email-change` | Xác nhận đổi email |
| `GET` | `/api/v1/auth/sessions` | Xem các thiết bị/phiên đang đăng nhập |
| `DELETE` | `/api/v1/auth/sessions/:sessionId` | Đăng xuất một phiên cụ thể |
| `DELETE` | `/api/v1/auth/sessions/others` | Đăng xuất tất cả phiên khác |

Các API register, login, refresh token và logout của Sprint 1 tiếp tục được sử dụng. Mỗi lần refresh thành công, backend xoay vòng refresh token: token cũ bị thu hồi và cookie nhận token mới.

## 5. Luồng nghiệp vụ

### Xác minh email

1. Backend tạo token ngẫu nhiên, chỉ lưu hash và hạn sử dụng.
2. Email chứa đường dẫn tới `/verify-email?token=...`.
3. Frontend gửi token về API xác minh.
4. Token hợp lệ được đánh dấu đã dùng và `email_verified_at` được cập nhật.

`REQUIRE_EMAIL_VERIFICATION=false` phù hợp khi phát triển local. Chỉ bật thành `true` ở môi trường có email delivery hoạt động ổn định.

### Quên mật khẩu

API luôn trả phản hồi chung để không tiết lộ email có tồn tại hay không. Token đặt lại mật khẩu có thời hạn, chỉ dùng một lần; sau khi đổi mật khẩu, các session cũ bị thu hồi.

### Đổi email

User phải đăng nhập. Backend gửi liên kết xác nhận tới địa chỉ mới và chỉ thay email sau khi token được xác nhận. Email mới vẫn phải duy nhất.

### Khóa tạm tài khoản

Mặc định, sau 5 lần nhập sai mật khẩu liên tiếp, tài khoản bị khóa 15 phút. Đăng nhập đúng sau khi hết thời gian khóa sẽ đặt lại bộ đếm.

## 6. OAuth

### GitHub

Cấu hình local trong `backend/.env`:

```env
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
GITHUB_CALLBACK_URL="http://localhost:3000/api/v1/auth/github/callback"
```

GitHub OAuth App phải dùng đúng callback URL. Client secret chỉ nằm ở backend, không đưa vào frontend hoặc commit lên Git.

### Google

Frontend nhận Google ID token rồi gửi tới `POST /api/v1/auth/google`. Backend xác minh issuer, audience và thông tin tài khoản dựa trên `GOOGLE_CLIENT_ID`.

## 7. Email development và production

Khi chưa cấu hình SMTP, development mail dùng JSON transport và backend log `actionUrl` ra terminal Docker. QA có thể mở URL này để kiểm thử xác minh email, reset mật khẩu hoặc đổi email.

Cấu hình production:

```env
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="..."
SMTP_PASSWORD="..."
MAIL_FROM="LMS Platform <no-reply@example.com>"
```

## 8. Bảo mật và quan sát hệ thống

- Global và auth-specific rate limiting.
- Helmet security headers, CORS allowlist và ẩn Express signature.
- Kiểm tra ownership cho course, section, lesson, quiz, question và option.
- Audit log cho request thay đổi dữ liệu và sự kiện auth quan trọng.
- Pino ghi log JSON và che password, cookie, authorization header và token.
- Có thể cấu hình `SENTRY_DSN` để gửi lỗi production tới Sentry.
- `GET /api/v1/health` kiểm tra tiến trình backend.
- `GET /api/v1/health/ready` kiểm tra backend đã kết nối PostgreSQL.

## 9. CI/CD, môi trường và backup

- Development dùng database `lms_db`.
- CI dùng database riêng `lms_test` và chạy lint, type-check, test, frontend build và E2E.
- Production dùng `.env.production`, `docker-compose.prod.yml` và volume database riêng.
- Khi merge vào `main`, job deploy chỉ chạy nếu repository variable `AUTO_DEPLOY_ENABLED=true` và có đủ `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_PATH`.

Backup PostgreSQL trên PowerShell:

```powershell
.\scripts\backup-db.ps1
```

File backup được ghi vào `backups/` theo timestamp. Production cần sao chép backup sang nơi lưu trữ mã hóa ngoài máy chủ và kiểm thử restore định kỳ.

## 10. Kiểm thử

```bash
docker compose exec backend npm test
docker compose exec backend node tests/integration/sprint6.auth-security.test.mjs
docker compose exec frontend npm run build
docker compose exec frontend npm run test:e2e
```

Swagger UI: `http://localhost:3000/api-docs/`.
