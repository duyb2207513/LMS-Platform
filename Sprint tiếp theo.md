## **Sprint 6 — Hoàn thiện hệ thống thực tế**

Đây là phần nên làm trước khi thêm tính năng lớn.

### **Authentication nâng cao**

* Xác minh email.  
* Quên và đặt lại mật khẩu.  
* Đăng nhập Google.  
* Quản lý các phiên đăng nhập.  
* Thu hồi refresh token.  
* Đổi email.  
* Khóa tài khoản sau nhiều lần đăng nhập sai.

### **Bảo mật**

* Rate limiting.  
* Security headers.  
* Validate file upload.  
* Giới hạn dung lượng ảnh, video, tài liệu.  
* Audit log cho hành động quan trọng.  
* Kiểm tra quyền sở hữu tài nguyên.  
* Logging và error tracking.

### **DevOps**

* CI chạy lint, type-check và test.  
* Tự động deploy khi merge vào main.  
* Tách database development, test và production.  
* Health check.  
* Backup database.  
* Docker production build.

Sprint này giúp project trông giống sản phẩm thực tế hơn.

## **Sprint 7 — Bài tập và chấm điểm**

Quiz hiện chỉ phù hợp câu hỏi trắc nghiệm. Có thể mở rộng thành hệ thống assignment.

### **Tính năng**

* Giảng viên tạo bài tập.  
* Thiết lập hạn nộp.  
* Học viên nộp văn bản hoặc file.  
* Cho phép nộp lại.  
* Giảng viên xem danh sách bài nộp.  
* Chấm điểm.  
* Viết nhận xét.  
* Học viên xem điểm.  
* Tính điểm tổng kết khóa học.

### **Bảng mới**

assignments  
assignment\_submissions  
submission\_files  
submission\_feedback  
course\_grade\_rules

Luồng:

Instructor tạo bài tập  
→ Student nộp bài  
→ Instructor chấm điểm  
→ Student nhận kết quả  
→ Hệ thống tính điểm tổng kết

Đây là phần mở rộng rất đúng bản chất LMS.

## **Sprint 8 — Thông báo và giao tiếp**

### **Notification**

* Thông báo trong website.  
* Email chào mừng.  
* Email khi đăng ký khóa học.  
* Nhắc hạn nộp bài.  
* Thông báo khóa học có bài mới.  
* Thông báo kết quả quiz.  
* Thông báo được cấp chứng chỉ.

Bảng:

notifications  
notification\_preferences  
email\_logs

### **Announcement**

Giảng viên có thể đăng thông báo:

Khóa học có bài mới  
Lịch học thay đổi  
Nhắc nộp bài  
Thông báo kiểm tra

Bảng:

course\_announcements

### **Realtime**

Có thể dùng WebSocket hoặc Socket.IO cho:

* Thông báo realtime.  
* Chat trong khóa học.  
* Trạng thái online.  
* Hỏi đáp trực tiếp.

Không nhất thiết làm cả chat và notification realtime ngay. Notification realtime có phạm vi nhỏ và dễ kiểm soát hơn.

## **Sprint 9 — Analytics cho Student và Instructor**

Đây là phần có giá trị tốt trong portfolio vì thể hiện xử lý dữ liệu và dashboard.

### **Dashboard Student**

* Tổng số khóa học đã đăng ký.  
* Khóa học đang học.  
* Khóa học hoàn thành.  
* Tổng thời gian học.  
* Điểm quiz trung bình.  
* Biểu đồ tiến độ.  
* Chuỗi ngày học liên tục.

### **Dashboard Instructor**

* Tổng số học viên.  
* Số lượt đăng ký theo ngày.  
* Tỷ lệ hoàn thành khóa học.  
* Bài học có tỷ lệ bỏ dở cao.  
* Điểm quiz trung bình.  
* Doanh thu.  
* Rating trung bình.  
* Khóa học hoạt động tốt nhất.

### **Bảng hỗ trợ**

learning\_events  
video\_watch\_events  
daily\_course\_statistics

Ban đầu có thể truy vấn trực tiếp PostgreSQL. Khi dữ liệu lớn mới tạo bảng thống kê tổng hợp.

## **Sprint 10 — Coupon, hoàn tiền và doanh thu**

Hệ thống Payment hiện có thể mở rộng thành module thương mại hoàn chỉnh hơn.

### **Coupon**

* Mã giảm theo phần trăm.  
* Mã giảm số tiền cố định.  
* Ngày bắt đầu và hết hạn.  
* Giới hạn số lượt sử dụng.  
* Chỉ áp dụng cho một số khóa học.  
* Mỗi người chỉ được sử dụng một lần.

Bảng:

coupons  
coupon\_courses  
coupon\_usages

### **Refund**

* Student gửi yêu cầu hoàn tiền.  
* Admin duyệt hoặc từ chối.  
* Ghi lại lý do.  
* Cập nhật trạng thái payment và order.  
* Thu hồi quyền truy cập nếu hoàn tiền thành công.

Bảng:

refund\_requests  
payment\_refunds

### **Doanh thu Instructor**

* Doanh thu gộp.  
* Phí nền tảng.  
* Doanh thu thực nhận.  
* Lịch sử thanh toán cho giảng viên.

Bảng:

instructor\_earnings  
payouts

Với portfolio, nên dùng payment sandbox, không cần xử lý tiền thật.

## **Sprint 11 — AI Learning Assistant**

Đây là hướng rất hợp với nền tảng AI và GraphRAG của bạn.

### **AI hỏi đáp theo khóa học**

Học viên hỏi:

> Trong bài này middleware ExpressJS hoạt động như thế nào?

Hệ thống:

Câu hỏi  
→ Embedding  
→ Tìm nội dung liên quan trong khóa học  
→ Lấy lesson/document phù hợp  
→ LLM tạo câu trả lời  
→ Trích dẫn bài học nguồn

Tính năng:

* Chỉ trả lời dựa trên tài liệu khóa học.  
* Trích dẫn lesson hoặc tài liệu.  
* Không lấy nội dung khóa học học viên chưa đăng ký.  
* Lưu lịch sử hội thoại.  
* Cho học viên đánh giá câu trả lời.  
* Instructor xem câu hỏi thường gặp.

Bảng:

ai\_conversations  
ai\_messages  
document\_chunks  
ai\_feedback

Có thể sử dụng:

PostgreSQL \+ pgvector

hoặc một vector database riêng.

### **Sinh quiz bằng AI**

* Instructor chọn một lesson.  
* AI đề xuất câu hỏi.  
* AI tạo các lựa chọn và đáp án.  
* Instructor bắt buộc review.  
* Chỉ lưu khi Instructor xác nhận.

AI không nên tự publish câu hỏi mà không có bước duyệt.

### **Tóm tắt bài học**

* Tóm tắt nội dung.  
* Tạo flashcard.  
* Tạo câu hỏi tự luyện.  
* Giải thích lại theo mức cơ bản hoặc nâng cao.

Đây có thể trở thành điểm nổi bật nhất của project.

## **Sprint 12 — Gợi ý khóa học**

### **Cấp độ đơn giản**

Gợi ý dựa trên:

* Category đã học.  
* Level phù hợp.  
* Rating.  
* Số lượt đăng ký.  
* Các khóa học cùng Instructor.

### **Cấp độ nâng cao**

* Collaborative filtering.  
* Content-based recommendation.  
* Lịch sử xem khóa học.  
* Tiến độ và kết quả học tập.  
* Embedding mô tả khóa học.

Bảng:

course\_views  
course\_recommendations  
user\_interests

Nên bắt đầu bằng rule-based recommendation trước, sau đó mới thêm Machine Learning.

## **Sprint 13 — Tìm kiếm nâng cao**

Hiện tại tìm kiếm có thể chỉ dùng:

title ILIKE '%express%'

Có thể mở rộng:

* PostgreSQL Full-Text Search.  
* Tìm theo title, description và learning outcome.  
* Gợi ý từ khóa.  
* Lưu lịch sử tìm kiếm.  
* Tìm kiếm không dấu tiếng Việt.  
* Sắp xếp theo độ liên quan.  
* Elasticsearch/OpenSearch nếu dữ liệu đủ lớn.

Bảng bổ sung:

search\_histories  
popular\_search\_terms

Với project cá nhân, PostgreSQL Full-Text Search thường đã đủ.

## **Sprint 14 — Video learning nâng cao**

* Ghi nhớ vị trí xem.  
* Tốc độ phát video.  
* Subtitle.  
* Transcript.  
* Chất lượng video khác nhau.  
* Chia video thành HLS.  
* Chống truy cập video khi chưa đăng ký.  
* Thống kê đoạn video thường bị xem lại.  
* Đánh dấu nội dung quan trọng.  
* Ghi chú theo timestamp.

Bảng:

lesson\_notes  
video\_watch\_sessions  
video\_playback\_events  
lesson\_bookmarks

Ví dụ học viên ghi chú:

Video 03:15 — middleware chạy ở đoạn này  
---

## **Sprint 15 — Multi-tenant cho trường học hoặc doanh nghiệp**

LMS ban đầu phục vụ người dùng cá nhân. Sau đó có thể mở rộng để mỗi tổ chức có không gian riêng.

### **Tính năng**

* Tạo Organization.  
* Thành viên thuộc Organization.  
* Organization Admin.  
* Khóa học nội bộ.  
* Nhóm/lớp học.  
* Gán khóa học bắt buộc.  
* Theo dõi tiến độ nhân viên.  
* Báo cáo riêng theo tổ chức.  
* Branding riêng.

Bảng:

organizations  
organization\_members  
organization\_courses  
classes  
class\_members  
course\_assignments

Đây là bước chuyển từ project LMS đơn giản sang sản phẩm SaaS.

## **Sprint 16 — Hiệu năng và mở rộng hạ tầng**

Chỉ nên làm sau khi hệ thống monolith đã ổn.

### **Redis**

Dùng cho:

* Cache danh sách khóa học.  
* Cache course detail.  
* Rate limiting.  
* Session hoặc token metadata.  
* Job status.

### **Queue**

Dùng BullMQ hoặc công cụ tương đương cho:

* Gửi email.  
* Sinh certificate PDF.  
* Xử lý video.  
* Sinh AI embedding.  
* Tổng hợp analytics.

Luồng:

Backend nhận request  
→ Tạo background job  
→ Trả response  
→ Worker xử lý  
→ Cập nhật kết quả

### **Object storage và CDN**

* Lưu thumbnail.  
* Lưu tài liệu.  
* Lưu video.  
* Phân phối nội dung qua CDN.  
* Signed URL cho nội dung riêng tư.

