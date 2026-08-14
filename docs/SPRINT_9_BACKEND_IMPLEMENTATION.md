# Sprint 9 — Backend Analytics cho Student và Instructor

## 1. Phạm vi đã triển khai

Sprint 9 hiện chỉ triển khai backend theo yêu cầu:

- Event tracking hoạt động học và phiên xem video.
- Dashboard analytics của Student.
- Dashboard analytics của Instructor.
- Date filter, timezone, course ownership và role authorization.
- Prisma migration, index, seed, Swagger, unit test và integration test.

Frontend và mobile analytics chưa nằm trong phạm vi lượt triển khai này.

## 2. Database

### `learning_events`

Lưu `COURSE_OPENED`, `LESSON_STARTED`, `LESSON_COMPLETED`, `QUIZ_STARTED`, `QUIZ_SUBMITTED` và `STUDY_SESSION`.

Các cột chính: `user_id`, `course_id`, `lesson_id`, `event_type`, `session_id`, `duration_seconds`, `metadata`, `occurred_at` và `created_at`.

### `video_watch_events`

Lưu lesson video, session, thời điểm bắt đầu/kết thúc, vị trí video, số giây hợp lệ và trạng thái hoàn thành.

### Idempotency và index

- Learning event duy nhất theo `(user_id, session_id, event_type, occurred_at)`.
- Video segment duy nhất theo `(user_id, session_id, started_at)`.
- Có index theo user/time, course/time, lesson/type và user/course/time.
- `daily_course_statistics` chưa được tạo vì truy vấn trực tiếp hiện vẫn phù hợp. Đây là bảng tùy chọn theo tài liệu Sprint 9.

## 3. API

Tất cả endpoint dùng prefix `/api/v1`.

### Event tracking — Student

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/analytics/events` | Ghi learning event, trả `204` kể cả request trùng |
| `POST` | `/analytics/video-watch-events` | Ghi video watch segment, trả `204` kể cả request trùng |

Client chỉ được gửi `COURSE_OPENED`, `LESSON_STARTED` và `STUDY_SESSION`. Backend tự tạo `LESSON_COMPLETED` khi hoàn thành lesson và `QUIZ_SUBMITTED` khi nộp quiz.

### Student dashboard

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `GET` | `/analytics/student/overview` | Enrollment KPI, thời gian học, quiz score và streak |
| `GET` | `/analytics/student/course-progress` | Tiến độ và lesson tiếp tục học |
| `GET` | `/analytics/student/activity` | Hoạt động theo ngày/tuần/tháng |
| `GET` | `/analytics/student/streak` | Current streak và longest streak |

### Instructor dashboard

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `GET` | `/analytics/instructor/overview` | Student, enrollment, completion, quiz, rating và revenue |
| `GET` | `/analytics/instructor/enrollments` | Enrollment trend và các bucket bằng 0 |
| `GET` | `/analytics/instructor/course-performance` | Hiệu quả từng course, sort và limit |
| `GET` | `/analytics/instructor/drop-off-lessons` | Lesson bắt đầu nhưng chưa hoàn thành |

Swagger UI: `http://localhost:3000/api-docs/`.

## 4. Metric definitions

- Student `averageQuizScore`: attempt `SUBMITTED` có điểm cao nhất của mỗi quiz, sau đó lấy trung bình.
- Student `totalLearningSeconds`: tổng `durationSeconds` của learning event cộng `watchedSeconds` của video event.
- Course progress: số lesson published đã hoàn thành chia tổng lesson published.
- Streak: ngày có ít nhất một learning/video event theo `Asia/Ho_Chi_Minh`; current streak được phép bắt đầu từ hôm nay hoặc hôm qua.
- Instructor `uniqueStudents`: student duy nhất có enrollment hợp lệ trong date range và course đã lọc.
- Completion rate: enrollment hoàn thành chia tổng enrollment hợp lệ trong cùng date range.
- Instructor quiz score: trung bình tất cả attempt `SUBMITTED` trong date range.
- Revenue: tổng price snapshot của order item có order `PAID` và payment `SUCCEEDED` trong date range.
- Drop-off: `(startedStudents - completedStudents) / startedStudents × 100`; lesson không có lượt bắt đầu bị loại.

## 5. Date range và timezone

- Query date dùng định dạng `YYYY-MM-DD`.
- Mặc định lấy 30 ngày gần nhất.
- Tối đa 365 ngày.
- Hỗ trợ `groupBy=day|week|month` tại endpoint biểu đồ.
- Database lưu UTC; bucket ngày dùng `Asia/Ho_Chi_Minh`.
- Instructor chỉ được truyền `courseId` thuộc chính mình; course của Instructor khác trả `403`.

## 6. Kiểm tra event

- `userId` luôn lấy từ access token.
- Chỉ role `STUDENT` được ghi event.
- Student phải có enrollment chưa hủy và course phải published.
- Lesson phải published và thuộc đúng course.
- `STUDY_SESSION` tối đa 300 giây/request.
- Timestamp không được quá 5 phút trong tương lai hoặc cũ quá 366 ngày.
- Video watch time không được lớn hơn thời gian thực của segment cộng sai số 5 giây.
- Video position không được vượt duration của lesson.
- Metadata chỉ nhận JSON phẳng, tối đa 20 field và 4 KB.

## 7. Docker, migration và seed

```bash
docker compose up -d --build
docker compose exec backend npm run db:generate
docker compose exec backend npm run db:deploy
docker compose exec backend npm run db:seed
```

Seed tạo learning events trong nhiều ngày và video segment cho `student@lms.test` để thử Student dashboard và lesson drop-off.

## 8. Kiểm thử

```bash
docker compose exec backend npm test
docker compose exec backend node tests/integration/sprint9.analytics.test.mjs
docker compose exec backend npm run test:integration
```

Test Sprint 9 bao phủ:

- Validation date range, sort whitelist, duration và event type.
- Streak liên tục, bị ngắt và dữ liệu rỗng.
- Student không ghi event cho course chưa enrollment.
- Request trùng không cộng thời gian hai lần.
- Student chỉ xem dữ liệu của chính mình.
- Student gọi Instructor API nhận `403`.
- Instructor không xem analytics của course người khác.
- Quiz best-score, revenue, activity, progress, empty bucket và drop-off calculation.

## 9. Chiến lược hiệu năng

Phiên bản đầu dùng PostgreSQL qua Prisma, lọc tại database và chỉ xử lý việc ghép bucket/metric đã giới hạn trong service. Date range tối đa 365 ngày và sort dùng whitelist, không nhận SQL tùy ý từ client.

Các index trong migration tập trung vào truy vấn dashboard chính. Khi dữ liệu event đủ lớn và query vượt mục tiêu response time, bước tiếp theo là thêm `daily_course_statistics`, job upsert theo `(course_id, stat_date)` và cơ chế rebuild theo khoảng ngày.

### Kết quả `EXPLAIN ANALYZE` local

Môi trường đo: PostgreSQL 17 Alpine trong Docker Desktop, database seed local ngày 14/08/2026. Dataset hiện nhỏ nên kết quả chỉ xác nhận query plan và index, không đại diện production.

| Query | Dữ liệu liên quan | Execution time | Query plan chính |
| --- | ---: | ---: | --- |
| Student learning activity 30 ngày | 7 learning events | 2.994 ms | Index Scan `learning_events_user_occurred_idx` |
| Instructor enrollment trend | 11 enrollments | 0.389 ms | Join và GroupAggregate |
| Lesson drop-off | 7 learning events | 0.135 ms | Bitmap Index Scan `learning_events_course_occurred_idx` |

Các bảng Sprint 9 được tạo cùng index trong một migration nên không có baseline “trước index” trên dữ liệu thật. Trước khi production, cần chạy lại với hàng chục nghìn event và ghi kết quả trước/sau nếu tiếp tục bổ sung hoặc thay đổi index.
