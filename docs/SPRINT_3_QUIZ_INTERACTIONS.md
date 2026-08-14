# Sprint 3 — Quiz và tương tác

## Mục tiêu

Sprint 3 bổ sung đánh giá trắc nghiệm và tương tác trong khóa học: quiz builder, attempt/chấm điểm tự động, review 1–5 sao và thảo luận theo lesson.

## Database

- `Quiz`, `Question`, `QuizOption` lưu cấu trúc đề trắc nghiệm.
- `QuizAttempt`, `AttemptAnswer` lưu từng lần làm và kết quả.
- `Review` lưu đánh giá course, unique theo `(courseId, userId)`.
- `Comment` hỗ trợ reply qua `parentId` và soft delete bằng `deletedAt`.

## Quiz API

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| POST | `/api/v1/lessons/:lessonId/quizzes` | Instructor/Admin tạo quiz |
| GET, PATCH, DELETE | `/api/v1/quizzes/:quizId` | Xem/quản lý quiz |
| POST | `/api/v1/quizzes/:quizId/questions` | Thêm question |
| PATCH, DELETE | `/api/v1/questions/:questionId` | Sửa/xóa question |
| POST | `/api/v1/questions/:questionId/options` | Thêm option |
| PATCH, DELETE | `/api/v1/options/:optionId` | Sửa/xóa option |
| POST | `/api/v1/quizzes/:quizId/attempts` | Student bắt đầu attempt |
| GET | `/api/v1/quizzes/:quizId/attempts/me` | Lịch sử attempt của Student |
| POST | `/api/v1/quiz-attempts/:attemptId/submit` | Nộp và chấm điểm |

## Review và comment API

| Method | Endpoint | Quyền |
| --- | --- | --- |
| GET | `/api/v1/courses/:courseId/reviews` | Public |
| POST | `/api/v1/courses/:courseId/reviews` | Student đã ghi danh |
| PATCH, DELETE | `/api/v1/reviews/:reviewId` | Chủ review/Admin |
| GET | `/api/v1/lessons/:lessonId/comments` | Người có quyền xem lesson |
| POST | `/api/v1/lessons/:lessonId/comments` | Thành viên khóa học |
| PATCH, DELETE | `/api/v1/comments/:commentId` | Chủ comment/Course owner/Admin |

## Quy tắc quiz

- Quiz chỉ publish khi có question và mỗi question có ít nhất hai option, đúng một đáp án đúng.
- Student không nhận `isCorrect` hoặc explanation trước khi submit.
- Mỗi Student chỉ có một attempt `IN_PROGRESS` trên một quiz.
- `maxAttempts` giới hạn tổng số lần làm.
- Backend tự tính `earnedPoints`, `totalPoints`, phần trăm và `passed`.
- Quiz đã có attempt không được thay đổi cấu trúc để giữ tính nhất quán kết quả.

## Quy tắc tương tác

- Mỗi Student chỉ có một review trên một course, nhưng có thể cập nhật.
- Rating chỉ nhận số nguyên từ 1 đến 5.
- Reply phải thuộc cùng lesson với comment cha.
- Soft-delete comment giữ nguyên cấu trúc hội thoại nhưng không trả nội dung đã xóa.

## Giao diện

- Web: quiz builder trong lesson, `/quiz/:quizId`, `/quiz-result`, rating và discussion trong trang học/course.
- Mobile: `QuizBuilder`, `Quiz`, `QuizResult`, rating và khu vực thảo luận lesson.

## Kiểm thử

```bash
docker compose exec backend node tests/integration/sprint3.lifecycle.test.mjs
docker compose exec backend npm test
```
