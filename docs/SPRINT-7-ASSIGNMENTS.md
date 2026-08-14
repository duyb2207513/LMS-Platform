# Sprint 7 — Bài tập và chấm điểm

## 1. Mục tiêu

Sprint 7 mở rộng LMS từ quiz trắc nghiệm sang assignment: giảng viên giao bài, học viên nộp văn bản hoặc file, giảng viên chấm điểm và hệ thống tính điểm tổng kết khóa học.

## 2. Trạng thái triển khai

| Thành phần | Trạng thái | Phạm vi |
| --- | --- | --- |
| Backend | Đã có | CRUD assignment, nộp lại, file riêng tư, danh sách bài nộp, chấm điểm, nhận xét và điểm tổng kết |
| Web | Đã có | Instructor tạo/quản lý/chấm bài; Student nộp bài và xem kết quả |
| Mobile | Chưa có | Chưa triển khai màn hình assignment Sprint 7 trên React Native |
| Swagger/test/seed | Đã có | API docs, validation test, integration test và dữ liệu demo |

## 3. Database

| Bảng | Vai trò |
| --- | --- |
| `assignments` | Nội dung bài tập, hạn nộp, điểm tối đa, quy tắc nộp lại và trạng thái công bố |
| `assignment_submissions` | Mỗi lần học viên nộp bài, nội dung văn bản, số lần nộp và trạng thái |
| `submission_files` | Metadata của file đính kèm; file vật lý nằm trong vùng không public |
| `submission_feedback` | Điểm, nhận xét và người chấm |
| `course_grade_rules` | Trọng số assignment, quiz và điểm đạt của khóa học |

## 4. API assignment

| Method | Endpoint | Quyền |
| --- | --- | --- |
| `GET` | `/api/v1/courses/:courseId/assignments` | Thành viên khóa học; dữ liệu nháp chỉ dành cho người quản lý |
| `POST` | `/api/v1/courses/:courseId/assignments` | Instructor sở hữu course hoặc Admin |
| `GET` | `/api/v1/assignments/:assignmentId` | Thành viên có quyền xem |
| `PATCH` | `/api/v1/assignments/:assignmentId` | Instructor sở hữu course hoặc Admin |
| `DELETE` | `/api/v1/assignments/:assignmentId` | Instructor sở hữu course hoặc Admin |
| `POST` | `/api/v1/assignments/:assignmentId/submissions` | Student đã enrollment |
| `GET` | `/api/v1/assignments/:assignmentId/submissions/me` | Student xem lịch sử của mình |
| `GET` | `/api/v1/assignments/:assignmentId/submissions` | Instructor sở hữu course hoặc Admin |
| `GET` | `/api/v1/submissions/:submissionId` | Chủ bài nộp, Instructor sở hữu course hoặc Admin |
| `PATCH` | `/api/v1/submissions/:submissionId/grade` | Instructor sở hữu course hoặc Admin |
| `GET` | `/api/v1/submission-files/:fileId/download` | Chủ file, Instructor sở hữu course hoặc Admin |

## 5. API điểm tổng kết

| Method | Endpoint | Quyền |
| --- | --- | --- |
| `GET` | `/api/v1/courses/:courseId/grades/rule` | Thành viên khóa học |
| `PUT` | `/api/v1/courses/:courseId/grades/rule` | Instructor sở hữu course hoặc Admin |
| `GET` | `/api/v1/courses/:courseId/grades/me` | Student xem điểm của mình |
| `GET` | `/api/v1/courses/:courseId/grades` | Instructor sở hữu course hoặc Admin |

## 6. Quy tắc bài tập và bài nộp

- Assignment có thể cấu hình `dueAt`, `maxScore`, `allowResubmission`, `maxSubmissions`, `allowLateSubmissions` và `isPublished`.
- Student phải enrollment mới xem và nộp được bài đã công bố.
- Backend kiểm tra hạn nộp, quyền nộp trễ, số lần nộp tối đa và quyền nộp lại.
- Mỗi lần nộp được đánh số `attemptNumber`; lịch sử cũ không bị ghi đè.
- Điểm không được âm hoặc vượt `maxScore` của assignment.
- Giảng viên có thể cập nhật điểm và nhận xét của bài đã chấm.
- Không thể hạ `maxScore` thấp hơn điểm đã chấm trong database.

## 7. Upload bài nộp an toàn

- Tối đa 5 file cho một lần nộp.
- Tối đa 20 MB mỗi file.
- Tối đa 50 MB cho toàn bộ lần nộp.
- Chỉ nhận các MIME type và định dạng tài liệu được cho phép.
- Backend kiểm tra tên file, kích thước, MIME type và nội dung nhận diện file khi phù hợp.
- File nằm trong `uploads/submissions` nhưng không được expose bằng `express.static`.
- Download luôn đi qua API có access token và kiểm tra ownership.

## 8. Công thức điểm tổng kết

Mặc định:

- Assignment: 60%.
- Quiz: 40%.
- Điểm đạt: 70/100.

Giảng viên có thể đổi ba giá trị này, nhưng tổng `assignmentWeight + quizWeight` phải bằng 100.

```text
assignmentPercent = tổng điểm assignment đã chấm / tổng điểm tối đa assignment × 100
quizPercent       = trung bình phần trăm các quiz đã làm
finalScore        = assignmentPercent × assignmentWeight / 100
                  + quizPercent × quizWeight / 100
passed            = finalScore >= passingScore
```

Với mỗi assignment, hệ thống dùng lần nộp mới nhất. Với mỗi quiz, hệ thống dùng attempt đã nộp có điểm cao nhất.

## 9. Giao diện web

### Instructor

- Danh sách và form tạo/sửa assignment trong Course Builder.
- Danh sách bài nộp theo assignment.
- Chi tiết bài nộp, tải file, nhập điểm và nhận xét.
- Cấu hình trọng số điểm của khóa học.

### Student

- Danh sách assignment trong khóa học đã đăng ký.
- Form nộp nội dung văn bản và chọn file từ máy.
- Lịch sử các lần nộp.
- Xem điểm, nhận xét và kết quả tổng kết khóa học.

## 10. Dữ liệu demo

```bash
docker compose exec backend npm run db:seed
```

Khóa học `React Native cho người mới` có dữ liệu assignment và một bài nộp đã chấm để QA kiểm tra giao diện. Các tài khoản demo dùng mật khẩu `Password123`:

- `student@lms.test`
- `instructor@lms.test`
- `admin@lms.test`

## 11. Kiểm thử

```bash
docker compose exec backend npm test
docker compose exec backend node tests/integration/sprint7.assignments.test.mjs
docker compose exec frontend npm run build
docker compose exec frontend npm run test:e2e
```

Các test liên quan trực tiếp:

- `backend/tests/unit/sprint7.validation.test.mjs`
- `backend/tests/integration/sprint7.assignments.test.mjs`

Swagger UI: `http://localhost:3000/api-docs/`.
