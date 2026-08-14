# Sprint 5 — Admin, bảo mật và triển khai

## 1. Mục tiêu

Sprint 5 bổ sung khu vực quản trị, các lớp bảo vệ cơ bản, dữ liệu demo, kiểm thử hành trình quan trọng và cấu hình chạy hệ thống bằng Docker.

## 2. Trạng thái triển khai

| Thành phần | Trạng thái | Phạm vi |
| --- | --- | --- |
| Backend | Đã có | Dashboard, quản lý user/course/review/comment, security middleware, upload validation, seed và test |
| Web | Đã có | Dashboard và các trang quản trị user, course, review, comment |
| Mobile | Một phần | Có quản lý category; chưa có toàn bộ màn hình kiểm duyệt của Admin |
| Docker/CI | Đã có | Docker Compose, PostgreSQL, migration, seed và GitHub Actions |

## 3. API quản trị

Tất cả endpoint bên dưới yêu cầu access token của tài khoản có role `ADMIN`.

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| `GET` | `/api/v1/admin/dashboard` | Thống kê tổng quan hệ thống |
| `GET` | `/api/v1/admin/users` | Danh sách và tìm kiếm user |
| `PATCH` | `/api/v1/admin/users/:userId` | Cập nhật role hoặc trạng thái user |
| `GET` | `/api/v1/admin/courses` | Danh sách khóa học để kiểm duyệt |
| `PATCH` | `/api/v1/admin/courses/:courseId` | Cập nhật trạng thái khóa học |
| `GET` | `/api/v1/admin/reviews` | Danh sách review |
| `DELETE` | `/api/v1/admin/reviews/:reviewId` | Xóa review vi phạm |
| `GET` | `/api/v1/admin/comments` | Danh sách comment |
| `DELETE` | `/api/v1/admin/comments/:commentId` | Xóa mềm comment vi phạm |

Các API danh sách hỗ trợ phân trang và tìm kiếm. Backend chặn Admin tự hạ role của chính mình hoặc tự khóa chính mình để tránh mất quyền quản trị ngoài ý muốn.

## 4. Dashboard cơ bản

Dashboard tổng hợp các chỉ số đang có trong hệ thống, gồm user, khóa học, enrollment, order và doanh thu. Web hiển thị các thẻ thống kê và liên kết nhanh tới từng khu vực quản lý.

## 5. Bảo mật

### HTTP và giới hạn request

- `Helmet` thiết lập security headers.
- Ẩn chữ ký Express (`x-powered-by`).
- CORS chỉ cho phép origin đã cấu hình và cho phép cookie xác thực.
- Rate limiting được áp dụng toàn API; nhóm auth có giới hạn chặt hơn.
- Backend luôn kiểm tra token, role và quyền sở hữu tài nguyên; router guard của frontend không thay thế việc kiểm tra ở backend.

### Kiểm tra upload

| Loại upload | Giới hạn | Ghi chú |
| --- | --- | --- |
| Avatar | 5 MB | Chỉ nhận định dạng ảnh được cho phép |
| Thumbnail khóa học | 5 MB | Kiểm tra MIME type và nội dung file |
| File bài học | 100 MB | Chỉ nhận ảnh, video và tài liệu trong allowlist |

Backend kiểm tra phần mở rộng, MIME type, kích thước và chữ ký đầu file khi phù hợp. File không hợp lệ trả `400` và không được lưu làm tài nguyên của hệ thống.

## 6. Dữ liệu demo

Chạy seed để tạo dữ liệu phục vụ phát triển và QA:

```bash
docker compose exec backend npm run db:seed
```

Mật khẩu chung của các tài khoản demo là `Password123`:

- `admin@lms.test`
- `instructor@lms.test`
- `student@lms.test`

Seed có user theo vai trò, category, course và dữ liệu học tập cần thiết cho các màn hình Sprint 1–5.

## 7. Chạy và kiểm thử bằng Docker

```bash
docker compose up -d --build
docker compose exec backend npm run db:deploy
docker compose exec backend npm run db:seed
docker compose exec backend npm test
docker compose exec backend npm run test:integration
docker compose exec frontend npm run build
docker compose exec frontend npm run test:e2e
```

Các test liên quan trực tiếp:

- `backend/tests/integration/sprint5.admin.test.mjs`
- `backend/tests/unit/sprint5.security.test.mjs`

## 8. CI và triển khai

Workflow `.github/workflows/ci.yml` khởi động hệ thống bằng Docker, sau đó chạy lint, type-check, unit test, integration test, frontend build và E2E. Chỉ nên deploy sau khi toàn bộ bước kiểm tra thành công.

Các địa chỉ khi chạy local:

- Web: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Swagger: `http://localhost:3000/api-docs/`
- Health check: `http://localhost:3000/api/v1/health`

## 9. Tiêu chí hoàn thành

- Student và Instructor gọi API Admin nhận `403`.
- Admin quản lý được user, course, review và comment.
- Dashboard trả số liệu từ database, không dùng số giả ở frontend.
- Upload sai loại hoặc vượt dung lượng bị từ chối.
- Seed chạy lặp lại an toàn cho môi trường phát triển.
- Các hành trình quan trọng vượt qua integration test và E2E.
