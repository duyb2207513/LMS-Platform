# Sprint 1 — Nền tảng, xác thực và quản lý khóa học

## Mục tiêu

Sprint 1 tạo nền tảng REST API và các hành trình đầu tiên của LMS: đăng ký/đăng nhập, hồ sơ cá nhân, category, danh mục khóa học công khai và vòng đời khóa học của giảng viên.

## Phạm vi đã triển khai

| Thành phần | Nội dung |
| --- | --- |
| Backend | ExpressJS + TypeScript, Prisma/PostgreSQL, JWT access/refresh token, Swagger, validation và phân quyền role |
| Web | Trang chủ, đăng nhập, đăng ký, catalog/chi tiết khóa học, profile, đổi mật khẩu, quản lý course và category |
| Mobile | Home, auth, catalog/chi tiết course, profile, course form và quản lý category cơ bản |
| Docker | PostgreSQL, backend, frontend và Expo Metro trong Docker Compose |

## Database

Các model nền tảng:

- `User`: thông tin tài khoản, role `STUDENT | INSTRUCTOR | ADMIN`, status `ACTIVE | BLOCKED`.
- `Category`: tên, slug và mô tả.
- `Course`: instructor, category, title/slug, mô tả, level, giá, trạng thái và thumbnail.

Mật khẩu chỉ lưu ở dạng hash. API response không trả `passwordHash`.

## API chính

### Authentication

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | Đăng ký Student, chuẩn hóa email và hash mật khẩu |
| POST | `/api/v1/auth/login` | Trả access token và đặt refresh token HttpOnly cookie |
| POST | `/api/v1/auth/refresh-token` | Xoay refresh token và cấp access token mới |
| POST | `/api/v1/auth/logout` | Thu hồi phiên và xóa refresh-token cookie |

### User

| Method | Endpoint | Quyền |
| --- | --- | --- |
| GET | `/api/v1/users/me` | Đã đăng nhập |
| PATCH | `/api/v1/users/me` | Chỉ profile của chính mình |
| POST, DELETE | `/api/v1/users/me/avatar` | Upload/xóa avatar của chính mình |
| PATCH | `/api/v1/users/me/password` | Đổi mật khẩu sau khi xác nhận mật khẩu hiện tại |

### Category và course

| Method | Endpoint | Quyền |
| --- | --- | --- |
| GET | `/api/v1/categories` | Public |
| POST, PATCH, DELETE | `/api/v1/categories...` | Admin |
| GET | `/api/v1/courses` | Public, có filter và phân trang |
| GET | `/api/v1/courses/:slug` | Public |
| GET | `/api/v1/instructor/courses` | Instructor/Admin |
| POST | `/api/v1/courses` | Instructor/Admin, tạo bản nháp |
| PATCH, DELETE | `/api/v1/courses/:courseId` | Course owner/Admin |
| POST | `/api/v1/courses/:courseId/thumbnail` | Course owner/Admin |
| POST | `/api/v1/courses/:courseId/publish` | Course owner/Admin |
| POST | `/api/v1/courses/:courseId/unpublish` | Course owner/Admin |

## Quy tắc nghiệp vụ

- Email không trùng và luôn chuyển về chữ thường.
- Password tối thiểu 8 ký tự, có chữ hoa, chữ thường và số.
- Client không được tự đặt role khi đăng ký.
- Student/Instructor nhận `403` khi gọi API Admin.
- Category tự sinh slug và không cho trùng name/slug.
- Course mới có trạng thái `DRAFT`; chỉ course đủ dữ liệu mới được publish.
- Course đã publish được archive thay vì xóa cứng.
- Router guard phía web/mobile chỉ hỗ trợ UX; backend vẫn kiểm tra token, role và ownership.

## Giao diện chính

Web: `/`, `/login`, `/register`, `/courses`, `/courses/:slug`, `/profile`, `/change-password`, `/instructor/courses`, `/instructor/courses/create`, `/instructor/courses/:id/edit`, `/admin/categories`.

Mobile cung cấp các screen tương ứng thông qua React Navigation và gọi cùng REST API.

## Kiểm thử

```bash
docker compose exec backend npm test
docker compose exec backend node tests/integration/auth.session.test.mjs
docker compose exec backend node tests/integration/users.profile.test.mjs
docker compose exec backend node tests/integration/categories.crud.test.mjs
docker compose exec backend node tests/integration/courses.lifecycle.test.mjs
```

Swagger: `http://localhost:3000/api-docs/`.
