# Sprint 2 — Nội dung và học tập

## Mục tiêu

Sprint 2 biến course thành nội dung có thể học: course builder theo chương/bài, upload tài liệu, enrollment miễn phí, kiểm tra quyền xem bài và lưu tiến độ.

## Database

- `Section`: chương của khóa học, sắp xếp bằng `position`.
- `Lesson`: bài học `VIDEO | TEXT | DOCUMENT`, trạng thái publish/preview/required.
- `Enrollment`: liên kết Student–Course, trạng thái và `progressPercent`.
- `LessonProgress`: vị trí video, trạng thái hoàn thành và thời điểm hoàn thành.

Quan hệ `Course → Section → Lesson` dùng cascade phù hợp. Enrollment có unique `(studentId, courseId)` để chống đăng ký trùng.

## API chính

### Section và lesson

| Method | Endpoint | Quyền |
| --- | --- | --- |
| GET, POST | `/api/v1/courses/:courseId/sections` | Course owner/Admin |
| PATCH, DELETE | `/api/v1/sections/:sectionId` | Course owner/Admin |
| POST | `/api/v1/sections/:sectionId/lessons` | Course owner/Admin |
| PATCH, DELETE | `/api/v1/lessons/:lessonId` | Course owner/Admin |
| POST | `/api/v1/lessons/:lessonId/file` | Course owner/Admin, multipart upload |

### Enrollment và học tập

| Method | Endpoint | Quyền |
| --- | --- | --- |
| POST | `/api/v1/courses/:courseId/enroll` | Student, course miễn phí đã publish |
| GET | `/api/v1/enrollments/me` | Student |
| GET | `/api/v1/courses/:courseId/content` | Thành viên khóa học/Course owner/Admin |
| PATCH | `/api/v1/lessons/:lessonId/progress` | Student đã ghi danh |
| GET | `/api/v1/courses/:courseId/progress` | Student đã ghi danh |

## Upload

- Course thumbnail: tối đa 5 MB.
- Lesson video/document: tối đa 100 MB.
- Backend kiểm tra extension/MIME và magic bytes, không tin tên file do client gửi.
- File được đổi tên khi lưu để tránh path traversal và ghi đè.

## Quy tắc quyền truy cập

- Instructor chỉ quản lý course do mình sở hữu; Admin có quyền quản lý toàn hệ thống.
- Student chỉ xem toàn bộ nội dung khi đã có enrollment hợp lệ.
- Bài preview có thể được hiển thị theo contract public của course; nội dung học đầy đủ vẫn do backend kiểm tra.
- Lesson chưa publish không hiển thị cho Student.
- Client không gửi `studentId` khi lưu progress; backend lấy từ access token.

## Tính tiến độ

1. Client gửi `lastWatchedSecond` khi xem video.
2. Khi hoàn thành, client gửi `isCompleted=true`.
3. Backend upsert `LessonProgress`.
4. Backend đếm số lesson bắt buộc đã hoàn thành trên tổng lesson bắt buộc.
5. `Enrollment.progressPercent` được cập nhật và trả về cho trang “Khóa học của tôi”.

## Giao diện

- Web Instructor: `/instructor/courses/:courseId/builder`.
- Web Student: `/my-courses`, `/learn/:courseId` với sidebar chương/bài, viewer video/text/document và progress bar.
- Mobile: `CourseBuilder`, `MyCourses`, `Learning`; hỗ trợ chọn file từ thiết bị và phát nội dung học.

## Kiểm thử

```bash
docker compose exec backend node tests/integration/learning.lifecycle.test.mjs
docker compose exec backend npm test
docker compose exec frontend npm run build
```
