# Kế hoạch kiểm thử tổng thể LMS Platform — Sprint 1 đến Sprint 10

## 1. Mục tiêu

Tài liệu này hướng dẫn QA kiểm tra lại toàn bộ LMS Platform sau khi hoàn thành Sprint 1–10, bao gồm backend REST API, frontend web, ứng dụng mobile, PostgreSQL và các luồng tích hợp.

Mục tiêu chính:

- Xác nhận các chức năng hoạt động đúng yêu cầu.
- Kiểm tra phân quyền giữa Guest, Student, Instructor và Admin.
- Kiểm tra tính nhất quán dữ liệu giữa backend, frontend, mobile và database.
- Phát hiện lỗi regression giữa các sprint.
- Xác định hệ thống có đủ điều kiện demo hoặc release hay chưa.

## 2. Nguyên tắc kiểm thử

Không nên bắt đầu bằng cách test tuần tự từng sprint. Trình tự đề xuất:

1. Chuẩn bị môi trường và dữ liệu sạch.
2. Chạy smoke test.
3. Chạy các hành trình E2E quan trọng.
4. Kiểm tra chi tiết từng sprint.
5. Kiểm tra phân quyền, bảo mật và dữ liệu biên.
6. Kiểm tra trực tiếp database.
7. Kiểm tra tính nhất quán giữa web và mobile.
8. Retest lỗi đã sửa.
9. Chạy full regression.

Nếu smoke test thất bại ở chức năng quan trọng, cần dừng vòng test và sửa lỗi trước khi tiếp tục.

## 3. Chuẩn bị môi trường

### 3.1. Dịch vụ cần hoạt động

- PostgreSQL.
- Backend API.
- Frontend web.
- Mobile Metro/Expo.
- Swagger API documentation.
- Health check backend.

### 3.2. Dữ liệu test tối thiểu

Cần chuẩn bị:

- Một tài khoản `STUDENT` đang hoạt động.
- Một tài khoản `INSTRUCTOR` đang hoạt động.
- Một tài khoản `ADMIN` đang hoạt động.
- Một tài khoản `BLOCKED`.
- Một tài khoản chưa xác minh email.
- Một tài khoản đã đăng nhập trên nhiều thiết bị.
- Khóa học miễn phí.
- Khóa học trả phí.
- Khóa học nháp.
- Khóa học đã xuất bản.
- Khóa học đã lưu trữ.
- Khóa học có đầy đủ section, lesson, quiz và assignment.
- Coupon hợp lệ, hết hạn, hết lượt và bị vô hiệu hóa.
- Đơn hàng pending, paid, cancelled và refunded.
- Certificate hợp lệ và mã certificate không tồn tại.

### 3.3. Reset dữ liệu

Nên reset database và chạy seed trước mỗi vòng test lớn. Không dùng dữ liệu đã bị thay đổi qua nhiều vòng test để đánh giá kết quả cuối cùng.

## 4. Smoke test

| ID | Hạng mục | Kết quả mong đợi | Trạng thái |
|---|---|---|---|
| SMK-01 | Backend health check | Trả về trạng thái healthy | ⬜ |
| SMK-02 | Swagger | Hiển thị đầy đủ API | ⬜ |
| SMK-03 | Kết nối PostgreSQL | Backend truy vấn được database | ⬜ |
| SMK-04 | Đăng ký | Tạo được Student mới | ⬜ |
| SMK-05 | Đăng nhập | Nhận access token và refresh cookie | ⬜ |
| SMK-06 | Refresh token | Nhận access token mới | ⬜ |
| SMK-07 | Đăng xuất | Cookie và trạng thái đăng nhập bị xóa | ⬜ |
| SMK-08 | Danh sách khóa học | Hiển thị khóa học published | ⬜ |
| SMK-09 | Chi tiết khóa học | Hiển thị đúng thông tin khóa học | ⬜ |
| SMK-10 | Đăng ký miễn phí | Tạo enrollment thành công | ⬜ |
| SMK-11 | Instructor tạo khóa học | Tạo được khóa học nháp | ⬜ |
| SMK-12 | Admin dashboard | Admin truy cập được dashboard | ⬜ |
| SMK-13 | Frontend | Kết nối được backend | ⬜ |
| SMK-14 | Mobile | Kết nối được backend trên thiết bị thật | ⬜ |

## 5. Hành trình E2E ưu tiên

### 5.1. Student học khóa miễn phí

```text
Đăng ký
→ Xác minh email
→ Đăng nhập
→ Tìm khóa học
→ Xem chi tiết
→ Đăng ký khóa học miễn phí
→ Mở trang học
→ Xem video/text/document
→ Lưu vị trí video
→ Đánh dấu hoàn thành
→ Làm quiz
→ Nộp assignment
→ Xem điểm
→ Đánh giá khóa học
→ Hoàn thành khóa học
→ Nhận certificate
```

Checklist:

- [ ] Student chỉ thấy nội dung sau khi đã đăng ký.
- [ ] Vị trí video được khôi phục đúng.
- [ ] Phần trăm tiến độ được cập nhật chính xác.
- [ ] Quiz bị giới hạn số lần làm theo cấu hình.
- [ ] Assignment nhận đúng văn bản và file.
- [ ] Student xem được điểm và nhận xét.
- [ ] Certificate chỉ được cấp khi đủ điều kiện.

### 5.2. Student mua khóa học trả phí

```text
Đăng nhập
→ Chọn khóa học trả phí
→ Áp dụng coupon
→ Tạo order
→ Checkout
→ Mock payment
→ Callback/webhook thành công
→ Tạo enrollment
→ Xem lịch sử đơn hàng
→ Học khóa học
→ Gửi yêu cầu hoàn tiền
```

Checklist:

- [ ] Order item lưu price snapshot.
- [ ] Coupon giảm đúng số tiền.
- [ ] Callback gửi lại không tạo payment/enrollment trùng.
- [ ] Payment thất bại không tạo enrollment.
- [ ] Khóa học đã mua xuất hiện trong “Khóa học của tôi”.
- [ ] Refund không được xử lý hai lần.

### 5.3. Instructor xây dựng và vận hành khóa học

```text
Đăng nhập
→ Tạo khóa học
→ Upload thumbnail
→ Tạo section
→ Tạo lesson
→ Upload video/tài liệu
→ Tạo quiz
→ Tạo assignment
→ Xuất bản khóa học
→ Xem danh sách bài nộp
→ Chấm điểm
→ Xem analytics
→ Xem doanh thu
```

Checklist:

- [ ] Instructor chỉ quản lý khóa học thuộc sở hữu của mình.
- [ ] Không xuất bản khóa học thiếu dữ liệu bắt buộc.
- [ ] Upload đúng type/size được chấp nhận.
- [ ] Upload sai type/size bị từ chối.
- [ ] Instructor không truy cập được khóa học của Instructor khác.
- [ ] Điểm và feedback hiển thị đúng cho Student.

### 5.4. Admin quản trị hệ thống

```text
Đăng nhập
→ Quản lý category
→ Quản lý user
→ Quản lý course
→ Quản lý review/comment
→ Tạo coupon
→ Duyệt refund
→ Xử lý payout
→ Xem dashboard
→ Kiểm tra audit log
```

Checklist:

- [ ] Student và Instructor nhận `403` khi gọi API Admin.
- [ ] Admin khóa/mở khóa user đúng.
- [ ] Không xóa category đang được course sử dụng.
- [ ] Refund và payout được ghi nhận đúng database.
- [ ] Hành động quan trọng có audit log.

## 6. Phạm vi kiểm thử theo sprint

| Sprint | Phạm vi chính |
|---|---|
| Sprint 1 | Auth, profile, category, course |
| Sprint 2 | Section, lesson, upload, enrollment, learning progress |
| Sprint 3 | Quiz, attempt, review, comment và reply |
| Sprint 4 | Order, mock payment, webhook, enrollment, certificate |
| Sprint 5 | Admin, security, upload validation, seed, deploy |
| Sprint 6 | Email verification, reset password, GitHub login, session management |
| Sprint 7 | Assignment, submission, grading, course grade |
| Sprint 8 | Notification, preference, announcement và communication |
| Sprint 9 | Analytics và dashboard theo role |
| Sprint 10 | Coupon, refund, revenue và payout |

Với mỗi API hoặc màn hình cần kiểm tra tối thiểu:

- Trường hợp thành công.
- Thiếu trường bắt buộc.
- Dữ liệu sai định dạng.
- Dữ liệu ở đúng giới hạn.
- Dữ liệu vượt giới hạn.
- Chưa đăng nhập.
- Token hết hạn hoặc không hợp lệ.
- Sai role.
- Resource không tồn tại.
- Resource thuộc user khác.
- Request gửi trùng.
- Nhiều request gửi gần như đồng thời.

## 7. Ma trận phân quyền

| Chức năng | Guest | Student | Instructor | Admin |
|---|---:|---:|---:|---:|
| Xem danh sách khóa học | ✅ | ✅ | ✅ | ✅ |
| Xem profile | ❌ | ✅ | ✅ | ✅ |
| Học nội dung | ❌ | Khi đã đăng ký | Theo quyền | ✅ |
| Đăng ký khóa học | ❌ | ✅ | ❌ | ❌ |
| Tạo khóa học | ❌ | ❌ | ✅ | ✅ |
| Quản lý khóa học | ❌ | ❌ | Khóa học sở hữu | ✅ |
| Tạo category | ❌ | ❌ | ❌ | ✅ |
| Làm quiz | ❌ | Khi đã đăng ký | Theo quyền | Theo quyền |
| Chấm assignment | ❌ | ❌ | Khóa học sở hữu | ✅ |
| Đánh giá khóa học | ❌ | Khi đủ điều kiện | ❌ | Theo chính sách |
| Quản lý coupon | ❌ | ❌ | ❌ | ✅ |
| Duyệt refund | ❌ | ❌ | ❌ | ✅ |
| Xử lý payout | ❌ | ❌ | ❌ | ✅ |

Phải kiểm tra phân quyền bằng cả giao diện và gọi trực tiếp API qua Swagger/Postman. Việc frontend ẩn nút không thay thế cho kiểm tra quyền ở backend.

## 8. Kiểm tra authentication và session

- [ ] Email đăng ký được chuyển về chữ thường.
- [ ] Email trùng trả `409`.
- [ ] Sai email hoặc mật khẩu trả cùng một thông báo chung.
- [ ] Tài khoản `BLOCKED` không đăng nhập được.
- [ ] Tài khoản tự khóa sau số lần đăng nhập sai quy định.
- [ ] Access token chứa đúng `userId` và `role`.
- [ ] Refresh token được lưu trong HttpOnly cookie.
- [ ] Refresh token được xoay vòng.
- [ ] Refresh token cũ bị thu hồi.
- [ ] Đăng xuất một thiết bị không làm sai trạng thái thiết bị khác.
- [ ] Đăng xuất tất cả thiết bị khác hoạt động đúng.
- [ ] Đổi mật khẩu thu hồi session cũ theo yêu cầu.
- [ ] Quên mật khẩu không tiết lộ email có tồn tại hay không.
- [ ] Reset token hết hạn hoặc đã dùng không sử dụng lại được.
- [ ] Đổi email chỉ hoàn tất sau khi xác nhận liên kết.
- [ ] GitHub OAuth tạo/liên kết đúng tài khoản.

## 9. Kiểm tra database

Sau các luồng quan trọng cần kiểm tra trực tiếp PostgreSQL:

- Password được hash, không lưu plain text.
- Role mặc định khi đăng ký là `STUDENT`.
- Refresh token/session được xoay vòng và thu hồi đúng.
- Soft-deleted record không xuất hiện trong API public.
- Order item lưu đúng price snapshot.
- Payment callback không tạo dữ liệu trùng.
- Một course không tạo enrollment trùng cho cùng Student.
- Lesson progress lưu đúng vị trí video và trạng thái hoàn thành.
- Phần trăm course progress được tính đúng.
- Quiz attempt không vượt giới hạn.
- Assignment submission và file liên kết đúng user/assignment.
- Feedback và điểm không bị tạo trùng.
- Course grade được tính đúng rule.
- Coupon usage tăng đúng và không vượt giới hạn.
- Refund không vượt số tiền đã thanh toán.
- Revenue, fee và payout không bị tính hai lần.
- Certificate có verification code duy nhất.

## 10. Kiểm tra frontend và mobile

### 10.1. Đồng bộ đa nền tảng

Dùng cùng một tài khoản để kiểm tra:

- Khóa học đã mua xuất hiện trên web và mobile.
- Tiến độ học được đồng bộ.
- Profile và avatar được đồng bộ.
- Thông báo đã đọc được đồng bộ.
- Assignment, điểm và feedback được đồng bộ.
- Đơn hàng, refund và certificate được đồng bộ.

### 10.2. Mobile

- [ ] Safe area đúng trên iPhone có tai thỏ/Dynamic Island.
- [ ] Bottom navigation không che nội dung.
- [ ] Bàn phím không che input hoặc button.
- [ ] Upload ảnh từ Photo Library hoạt động.
- [ ] Upload document từ Files hoạt động.
- [ ] Video tiếp tục từ vị trí đã lưu.
- [ ] Vuốt notification hoạt động ổn định.
- [ ] Lesson/quiz chuyển bằng swipe đúng.
- [ ] Pull-to-refresh hoạt động.
- [ ] Dark mode có độ tương phản tốt.
- [ ] Haptic không bị kích hoạt quá nhiều.
- [ ] Mất mạng hiển thị banner offline.
- [ ] Dữ liệu cache hiển thị khi mất mạng.
- [ ] Cache của user cũ không xuất hiện sau đăng xuất.
- [ ] Đổi Wi-Fi/4G không làm app crash.
- [ ] Quay lại màn trước giữ trạng thái hợp lý.

### 10.3. Frontend web

- [ ] Responsive trên desktop, tablet và mobile browser.
- [ ] Router guard chuyển đúng `/login` hoặc `/403`.
- [ ] Refresh trình duyệt không làm mất session sai cách.
- [ ] Axios chỉ refresh token một lần khi nhiều request cùng nhận `401`.
- [ ] Upload hiển thị preview và lỗi validation rõ ràng.
- [ ] Loading, empty và error state đầy đủ.
- [ ] Các button có trạng thái disabled/loading khi gửi request.
- [ ] Không có lỗi nghiêm trọng trong Browser Console.

## 11. Kiểm tra bảo mật và độ ổn định

- [ ] Security headers xuất hiện trong response.
- [ ] Rate limiting hoạt động và trả `429` đúng lúc.
- [ ] Rate limit không chặn nhầm người dùng bình thường.
- [ ] File giả mạo extension bị từ chối.
- [ ] File vượt dung lượng bị từ chối.
- [ ] Không truy cập được file riêng tư của user khác.
- [ ] Không thể client tự gửi `role`, `status`, `userId` để vượt quyền.
- [ ] Không trả password hash, refresh token hoặc secret trong response.
- [ ] Error production không lộ stack trace hoặc thông tin database.
- [ ] Webhook/callback có idempotency.
- [ ] Ownership được kiểm tra ở course, lesson, assignment, submission và comment.
- [ ] Audit log ghi đúng actor, action, resource và thời gian.

## 12. Mẫu test case

| Trường | Nội dung |
|---|---|
| Test Case ID | Ví dụ: `AUTH-LOGIN-001` |
| Tên test case | Đăng nhập thành công bằng Student hợp lệ |
| Module | Authentication |
| Priority | Critical/High/Medium/Low |
| Preconditions | User ACTIVE và đã xác minh email |
| Test data | Email, password |
| Steps | Các bước thực hiện |
| Expected result | Kết quả mong đợi |
| Actual result | Kết quả thực tế |
| Status | Pass/Fail/Blocked/Not Run |
| Evidence | Screenshot, video, request/response |

## 13. Mẫu báo cáo bug

```text
Tiêu đề:
Môi trường:
Phiên bản/commit:
Thiết bị/trình duyệt:
Tài khoản và role:
Điều kiện trước:
Các bước tái hiện:
Kết quả thực tế:
Kết quả mong đợi:
API và status code:
Request/response liên quan:
Ảnh hoặc video:
Mức độ: Critical / High / Medium / Low
```

Ví dụ:

```text
[High][Payment] Callback gửi hai lần tạo hai enrollment

Role: STUDENT
API: POST /api/v1/payments/mock/callback

Expected:
Chỉ có một enrollment được tạo.

Actual:
Database tạo hai enrollment cho cùng user và course.
```

## 14. Phân loại mức độ lỗi

| Mức độ | Mô tả | Ví dụ |
|---|---|---|
| Critical | Mất dữ liệu, sai tiền, vượt quyền hoặc hệ thống không sử dụng được | Thanh toán hai lần, Student gọi được API Admin |
| High | Luồng chính không hoàn thành được | Không đăng nhập, mua khóa học hoặc nộp bài được |
| Medium | Chức năng phụ sai nhưng có cách xử lý thay thế | Validation sai, số liệu phụ không đúng |
| Low | Lỗi giao diện hoặc nội dung nhỏ | Lệch spacing, typo, animation chưa mượt |

Không nên release khi còn bug Critical. Bug High phải được đánh giá và chấp thuận rõ ràng nếu chưa thể sửa trước release.

## 15. Quy trình retest và regression

1. Developer thông báo commit hoặc build đã sửa.
2. QA retest đúng test case từng thất bại.
3. Kiểm tra thêm trường hợp liên quan trực tiếp.
4. Cập nhật evidence và trạng thái bug.
5. Chạy smoke test lại nếu sửa auth, database, payment hoặc middleware.
6. Chạy regression các module bị ảnh hưởng.
7. Chạy full regression trước release chính thức.

## 16. Tiêu chí hoàn thành vòng test

Một vòng test có thể kết thúc khi:

- Smoke test đạt 100%.
- Các hành trình E2E quan trọng đều đạt.
- Không còn bug Critical.
- Bug High còn lại đã được đánh giá và chấp thuận.
- Phân quyền và ownership được kiểm tra đầy đủ.
- Migration và seed chạy được trên database sạch.
- Backend, frontend và mobile sử dụng thống nhất API contract.
- Test report đã được cập nhật.
- Evidence cho test quan trọng đã được lưu.

## 17. Báo cáo tổng kết QA

| Chỉ số | Giá trị |
|---|---:|
| Tổng test case | |
| Passed | |
| Failed | |
| Blocked | |
| Not Run | |
| Bug Critical đang mở | |
| Bug High đang mở | |
| Bug Medium đang mở | |
| Bug Low đang mở | |

Kết luận cuối vòng test:

```text
Build/commit:
Môi trường:
Phạm vi đã test:
Phạm vi chưa test:
Rủi ro còn lại:
Đề xuất: Ready for Demo / Ready for Release / Not Ready
Người kiểm thử:
Ngày kiểm thử:
```

## 18. Thứ tự bắt đầu đề xuất cho QA

1. Reset và seed database.
2. Xác nhận Docker và health check.
3. Chạy toàn bộ smoke test.
4. Chạy hành trình Student miễn phí.
5. Chạy hành trình Student trả phí.
6. Chạy hành trình Instructor.
7. Chạy hành trình Admin.
8. Test API trực tiếp bằng Swagger/Postman.
9. Kiểm tra database.
10. Kiểm tra frontend và iPhone thật.
11. Test security và các trường hợp lỗi.
12. Retest bug.
13. Chạy full regression Sprint 1–10.
14. Lập báo cáo QA và đưa ra quyết định release.
