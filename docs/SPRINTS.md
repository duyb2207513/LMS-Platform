# Tài liệu triển khai theo Sprint

Trang này là mục lục tổng cho LMS Platform. Nội dung được đối chiếu theo code hiện tại, vì vậy trạng thái “Đã có” chỉ được dùng khi chức năng thực sự tồn tại trong thành phần tương ứng.

## 1. Danh sách tài liệu

| Sprint | Chủ đề | Tài liệu |
| --- | --- | --- |
| 1 | Nền tảng, auth, user, category và course | [Sprint 1](SPRINT_1_FOUNDATION_AUTH_COURSES.md) |
| 2 | Nội dung và học tập | [Sprint 2](SPRINT_2_CONTENT_LEARNING.md) |
| 3 | Quiz và tương tác | [Sprint 3](SPRINT_3_QUIZ_INTERACTIONS.md) |
| 4 | Payment và certificate | [Sprint 4](SPRINT_4_PAYMENT_CERTIFICATES.md) |
| 5 | Admin, bảo mật và deploy | [Sprint 5](SPRINT_5_ADMIN_SECURITY_DEPLOY.md) |
| 6 | Hoàn thiện hệ thống thực tế | [Sprint 6](SPRINT-6-PRODUCTION.md) |
| 7 | Bài tập và chấm điểm | [Sprint 7](SPRINT-7-ASSIGNMENTS.md) |
| 8 | Notifications và communication | [Yêu cầu Sprint 8](SPRINT_8_NOTIFICATIONS_COMMUNICATION.md) · [Backend đã triển khai](SPRINT_8_BACKEND_IMPLEMENTATION.md) |
| 9 | Analytics cho Student và Instructor | [Yêu cầu Sprint 9](SPRINT_9_ANALYTICS_DASHBOARDS.md) · [Backend đã triển khai](SPRINT_9_BACKEND_IMPLEMENTATION.md) |

## 2. Ma trận trạng thái

| Sprint | Backend | Web | Mobile | Ghi chú |
| --- | --- | --- | --- | --- |
| 1 | Đã có | Đã có | Đã có | Auth, profile, category, course |
| 2 | Đã có | Đã có | Đã có | Section, lesson, enrollment và progress |
| 3 | Đã có | Đã có | Đã có | Quiz, review và thảo luận |
| 4 | Đã có | Đã có | Đã có | Mock payment, order và certificate |
| 5 | Đã có | Đã có | Một phần | Mobile có quản lý category, chưa có đầy đủ moderation Admin |
| 6 | Đã có | Đã có | Một phần | Mobile chưa có đầy đủ email/OAuth/session management |
| 7 | Đã có | Đã có | Chưa có | Assignment và chấm điểm chưa triển khai trên mobile |
| 8 | Đã có | Chưa có | Chưa có | Theo yêu cầu hiện tại, Sprint 8 mới triển khai backend |
| 9 | Đã có | Chưa có | Chưa có | Analytics Student/Instructor hiện mới triển khai backend |

## 3. Kiến trúc chung

- Backend: Node.js, Express, TypeScript, Prisma và PostgreSQL.
- Web: Vue 3, TypeScript, Pinia, Vue Router và Axios.
- Mobile: React Native với Expo.
- API: REST dưới prefix `/api/v1`.
- Authentication: access token qua `Authorization: Bearer ...`; refresh token nằm trong cookie `HttpOnly`.
- Tài liệu API: OpenAPI/Swagger tại `/api-docs/`.
- Môi trường local: Docker Compose.

## 4. Chạy toàn hệ thống bằng Docker

Từ thư mục gốc dự án:

```bash
docker compose up -d --build
docker compose exec backend npm run db:deploy
docker compose exec backend npm run db:seed
```

Các địa chỉ local:

- Web: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Swagger: `http://localhost:3000/api-docs/`
- Health: `http://localhost:3000/api/v1/health`
- PostgreSQL: cổng được khai báo trong `docker-compose.yml`

Xem log:

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

## 5. Migration và seed

Sau khi pull code có migration mới:

```bash
docker compose exec backend npm run db:deploy
docker compose exec backend npm run db:seed
```

Không dùng `prisma migrate dev` trực tiếp trong container production. Không commit file `.env` chứa secret.

## 6. Kiểm thử

```bash
docker compose exec backend npm run lint
docker compose exec backend npm run type-check
docker compose exec backend npm test
docker compose exec backend npm run test:integration
docker compose exec frontend npm run build
docker compose exec frontend npm run test:e2e
```

Integration test được tách theo từng sprint trong `backend/tests/integration`. CI chạy lại toàn bộ chuỗi kiểm tra trên mỗi push và pull request.

## 7. Quy ước API

Response thành công thông thường:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Response lỗi được xử lý tập trung, có HTTP status phù hợp và không trả stack trace hoặc secret cho client.

Quy tắc phân quyền:

- `STUDENT`: học, làm quiz, nộp assignment, review và thanh toán.
- `INSTRUCTOR`: quản lý khóa học mình sở hữu và nội dung liên quan.
- `ADMIN`: quản trị toàn hệ thống.
- Quyền luôn được kiểm tra ở backend; kiểm tra role ở frontend/mobile chỉ phục vụ trải nghiệm giao diện.

## 8. Tài liệu bổ sung

- [API ghi chú](api.md)
- [Database](database.md)
- [Onboarding](onboard.md)
- [Requirements](requirements.md)
- [User flow](user-flow.md)
