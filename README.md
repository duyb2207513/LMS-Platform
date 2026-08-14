# LMS Platform

Nền tảng học trực tuyến gồm REST API Express/TypeScript, PostgreSQL/Prisma, web Vue 3 và mobile React Native/Expo. Dự án đã bao phủ đăng nhập, khóa học, học tập, quiz/tương tác, assignment, mock payment, certificate, notification realtime và quản trị.

## Chạy local bằng Docker

Yêu cầu: Docker Desktop và Docker Compose.

```bash
docker compose up -d --build
docker compose exec backend npm run db:deploy
docker compose exec backend npm run db:seed
```

Địa chỉ:

- Web: http://localhost:5173
- REST API: http://localhost:3000/api/v1
- Swagger: http://localhost:3000/api-docs
- Health check: http://localhost:3000/api/v1/health
- Expo Metro: `http://<IP-LAN-của-máy>:8081`

Tài khoản demo, cùng mật khẩu `Password123`:

| Vai trò | Email |
|---|---|
| Student | `student@lms.test` |
| Instructor | `instructor@lms.test` |
| Admin | `admin@lms.test` |
| Blocked | `blocked@lms.test` |

Seed có category, course miễn phí/trả phí, section/lesson, quiz, assignment, review/comment, announcement, notification, email log, một đơn đã thanh toán, enrollment hoàn thành và certificate `LMS-2026-DEMO0001`.

## Cấu trúc

```text
backend/   Express REST API, Prisma migrations, Swagger, tests
frontend/  Vue 3, Pinia, admin portal, Playwright E2E
mobile/    React Native + Expo, kết nối cùng REST API
docs/      Tài liệu dự án
```

## Sprint 5 Admin API

Tất cả endpoint dưới đây yêu cầu Bearer token role `ADMIN`:

```text
GET    /api/v1/admin/dashboard
GET    /api/v1/admin/users
PATCH  /api/v1/admin/users/:userId
GET    /api/v1/admin/courses
PATCH  /api/v1/admin/courses/:courseId
GET    /api/v1/admin/reviews
DELETE /api/v1/admin/reviews/:reviewId
GET    /api/v1/admin/comments
DELETE /api/v1/admin/comments/:commentId
```

Admin web có các trang `/admin`, `/admin/users`, `/admin/courses`, `/admin/reviews`, `/admin/comments` và `/admin/categories`.

## Bảo mật

- Helmet security headers và tắt `X-Powered-By`.
- Rate limit toàn API và giới hạn chặt hơn cho auth.
- JWT access/refresh token, role authorization phía backend.
- Thumbnail tối đa 5 MB; lesson file tối đa 100 MB.
- Kiểm tra MIME allowlist và magic bytes cho JPG/PNG/WebP, MP4/WebM, PDF, Word và PowerPoint.
- Webhook mock payment dùng HMAC và xử lý idempotent.
- Không trả password hash từ API quản trị.

Các giới hạn có thể cấu hình bằng `RATE_LIMIT_*` và `AUTH_RATE_LIMIT_*` trong `.env`.

## Kiểm thử

```bash
docker compose exec backend npm test
docker compose exec backend npm run test:integration
docker compose exec frontend npm run build
docker compose exec frontend npm run test:e2e
```

E2E bao phủ xem course công khai và hành trình đăng nhập Admin qua dashboard, user, course, review và comment. CI nằm tại `.github/workflows/ci.yml`.

Backend Sprint 8 bổ sung notification/preferences, course announcement, Socket.IO, email log và reminder assignment. Chi tiết tại `docs/SPRINT_8_BACKEND_IMPLEMENTATION.md`.

## Deploy production

Sao chép file môi trường và thay toàn bộ secret:

```bash
cp .env.production.example .env.production
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Sprint 6 bổ sung xác minh email, quên/đặt lại mật khẩu, Google/GitHub login, đổi email, quản lý phiên đăng nhập, refresh-token rotation, khóa tạm khi đăng nhập sai, audit log, structured logging và Sentry tùy chọn. Hướng dẫn cấu hình chi tiết nằm tại `docs/SPRINT-6-PRODUCTION.md`.

Production Compose tự chạy Prisma migration, phục vụ Vue qua Nginx, proxy `/api` và lưu PostgreSQL/uploads trong named volumes. Nên đặt reverse proxy HTTPS hoặc load balancer phía trước cổng 80, backup volume PostgreSQL định kỳ và không chạy seed demo trên dữ liệu thật.

Xem log và cập nhật phiên bản:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```
