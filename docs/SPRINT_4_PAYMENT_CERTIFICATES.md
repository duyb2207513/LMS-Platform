# Sprint 4 — Payment và certificate

## Mục tiêu

Sprint 4 bổ sung quy trình mua khóa học trả phí bằng mock payment, xử lý callback/webhook idempotent, tạo enrollment sau thanh toán và phát hành/xác minh certificate.

## Database

- `Order`: đơn hàng và trạng thái `PENDING | PAID | CANCELLED`.
- `OrderItem`: course và `priceSnapshot` tại thời điểm đặt hàng.
- `Payment`: provider, amount, currency, transaction ID và trạng thái.
- `PaymentWebhookEvent`: khóa idempotency `(provider, eventId)` và payload callback.
- `Certificate`: snapshot tên học viên/course/instructor, số chứng chỉ và verification code.

## Order và payment API

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| POST | `/api/v1/orders` | Tạo order từ danh sách course trả phí |
| GET | `/api/v1/orders/me` | Lịch sử đơn của Student |
| GET | `/api/v1/orders/:orderId` | Chi tiết đơn thuộc chính người dùng |
| DELETE | `/api/v1/orders/:orderId` | Hủy đơn pending chưa thanh toán |
| POST | `/api/v1/orders/:orderId/payments/mock` | Khởi tạo/reuse mock payment |
| GET | `/api/v1/payments/mock/:paymentId` | Mở trang mock checkout |
| POST | `/api/v1/payments/mock/:paymentId/callback` | Giả lập kết quả cổng thanh toán |
| POST | `/api/v1/payments/webhooks/mock` | Webhook ký HMAC và idempotent |

## Certificate API

| Method | Endpoint | Quyền |
| --- | --- | --- |
| POST | `/api/v1/courses/:courseId/certificates` | Student đã hoàn thành khóa học |
| GET | `/api/v1/certificates/me` | Student |
| GET | `/api/v1/certificates/:certificateId` | Chủ certificate/Admin |
| GET | `/api/v1/certificates/verify/:code` | Public |
| DELETE | `/api/v1/certificates/:certificateId` | Admin thu hồi |

## Luồng thanh toán

1. Backend đọc giá course hiện tại và ghi `OrderItem.priceSnapshot`.
2. Student tạo mock payment cho order pending.
3. Callback/webhook phải khớp amount và currency.
4. Backend ghi `PaymentWebhookEvent` trước khi xử lý.
5. Event trùng trả kết quả an toàn, không tạo enrollment lần hai.
6. Thanh toán thành công cập nhật Payment/Order trong transaction và tạo enrollment bằng unique constraint.

## Điều kiện certificate

- Có enrollment của course.
- Enrollment đạt `COMPLETED` và progress 100%.
- Đã pass tất cả quiz được publish trong course.
- Mỗi `(studentId, courseId)` chỉ có một certificate.
- API verify công khai chỉ trả snapshot cần thiết và trạng thái hợp lệ/đã thu hồi.

## Giao diện

- Web: `/checkout/:orderId`, `/orders`, `/payment-result/:orderId`, `/certificates`, `/certificates/verify/:code?`.
- Mobile: `Orders`, `Checkout`, `MockPayment`, `PaymentResult`, `Certificates`, `VerifyCertificate`.

## Kiểm thử

```bash
docker compose exec backend node tests/integration/sprint4.lifecycle.test.mjs
docker compose exec backend npm test
```
