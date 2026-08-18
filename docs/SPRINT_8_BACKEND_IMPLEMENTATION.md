# Sprint 8 — Backend thông báo và giao tiếp

Phần backend triển khai theo `docs/SPRINT_8_NOTIFICATIONS_COMMUNICATION.md`. Frontend và mobile không nằm trong thay đổi này.

## Thành phần đã triển khai

- Bốn bảng PostgreSQL: `notifications`, `notification_preferences`, `email_logs`, `course_announcements`.
- Notification service hỗ trợ một hoặc nhiều người nhận và áp dụng preferences.
- REST API notification, unread count, read/read-all/delete và preferences.
- CRUD/publish course announcement với kiểm tra enrollment, author và course ownership.
- Publish idempotent: chỉ một request có thể chuyển `DRAFT` sang `PUBLISHED` và fan-out notification.
- Socket.IO xác thực access token, tự join room `user:<userId>` và không nhận `userId` từ client.
- Email log `PENDING` → `SENT`/`FAILED`; lỗi SMTP không làm hỏng đăng ký tài khoản hoặc ghi danh.
- Email chào mừng, email ghi danh và job nhắc assignment sắp hết hạn trong 24 giờ.
- Notification từ đăng ký, ghi danh, quiz result, certificate và course announcement.

## REST API

| Method | Endpoint |
| --- | --- |
| GET | `/api/v1/notifications` |
| GET | `/api/v1/notifications/unread-count` |
| PATCH | `/api/v1/notifications/:id/read` |
| PATCH | `/api/v1/notifications/read-all` |
| DELETE | `/api/v1/notifications/:id` |
| GET, PATCH | `/api/v1/notification-preferences` |
| GET, POST | `/api/v1/courses/:courseId/announcements` |
| PATCH, DELETE | `/api/v1/announcements/:id` |
| POST | `/api/v1/announcements/:id/publish` |

Swagger: `http://localhost:3000/api-docs/`.

## Socket.IO

Kết nối tới `http://localhost:3000` và gửi access token trong handshake:

```ts
io('http://localhost:3000', { auth: { token: accessToken } });
```

Server emit các event `notification:new`, `notification:read`, `notification:read-all` và `announcement:published`.

## Docker và kiểm thử

```bash
docker compose up -d --build
docker compose exec backend npm run db:deploy
docker compose exec backend npm run db:seed
docker compose exec backend npm test
docker compose exec backend npm run test:integration
```

Biến `ASSIGNMENT_REMINDER_INTERVAL_MINUTES` điều chỉnh chu kỳ quét reminder, mặc định 15 phút. SMTP tiếp tục sử dụng các biến `SMTP_*`; nếu không cấu hình SMTP ở development, Nodemailer sử dụng JSON transport để có thể kiểm thử an toàn.
