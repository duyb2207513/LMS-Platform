# Sprint 7 — Bài tập và chấm điểm

Sprint 7 bổ sung quy trình assignment đầy đủ cho LMS: giảng viên giao bài, học viên nộp văn bản hoặc file, giảng viên chấm điểm và hệ thống tính điểm tổng kết khóa học.

## Chức năng

- Giảng viên/Admin tạo, sửa và xóa bài tập của khóa học mình quản lý.
- Thiết lập hạn nộp, nộp trễ, số lần nộp và trạng thái công bố.
- Học viên đã ghi danh nộp tối đa 5 file mỗi lần, 20 MB mỗi file và 50 MB tổng cộng.
- File bài nộp không được public qua `/uploads`; việc tải file luôn đi qua API có xác thực và kiểm tra quyền.
- Giảng viên xem từng lần nộp, cho điểm và viết/cập nhật nhận xét.
- Học viên xem lịch sử nộp, điểm và nhận xét.
- Điểm tổng kết kết hợp điểm assignment và quiz theo trọng số do giảng viên cấu hình.

## API chính

| Method | Endpoint | Quyền |
| --- | --- | --- |
| GET, POST | `/api/v1/courses/:courseId/assignments` | Thành viên khóa học / Instructor, Admin |
| GET, PATCH, DELETE | `/api/v1/assignments/:assignmentId` | Thành viên khóa học / Instructor, Admin |
| POST | `/api/v1/assignments/:assignmentId/submissions` | Student |
| GET | `/api/v1/assignments/:assignmentId/submissions/me` | Student |
| GET | `/api/v1/assignments/:assignmentId/submissions` | Instructor, Admin |
| PATCH | `/api/v1/submissions/:submissionId/grade` | Instructor, Admin |
| GET | `/api/v1/submission-files/:fileId/download` | Chủ bài nộp / Instructor, Admin |
| GET, PUT | `/api/v1/courses/:courseId/grades/rule` | Instructor, Admin |
| GET | `/api/v1/courses/:courseId/grades/me` | Student |
| GET | `/api/v1/courses/:courseId/grades` | Instructor, Admin |

Swagger UI: `http://localhost:3000/api-docs/`.

## Chạy bằng Docker

```bash
docker compose up -d --build
docker compose exec backend npm run db:deploy
docker compose exec backend npm run db:seed
```

Frontend: `http://localhost:5173`. Backend: `http://localhost:3000`.

Tài khoản demo dùng mật khẩu `Password123`:

- `student@lms.test`
- `instructor@lms.test`
- `admin@lms.test`

Khóa học `React Native cho người mới` có sẵn hai bài tập và một bài nộp đã được chấm để kiểm thử giao diện.

## Kiểm thử

```bash
docker compose exec backend npm test
docker compose exec backend node tests/integration/sprint7.assignments.test.mjs
docker compose exec frontend npm run build
docker compose exec frontend npm run test:e2e
```
