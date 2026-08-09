# LMS Platform Mobile — Sprint 1

Ứng dụng Expo React Native kết nối trực tiếp với REST API Express tại `/api/v1`.

## Chức năng

- Public: trang chủ, đăng ký, đăng nhập, danh sách và chi tiết khóa học.
- Tài khoản: profile, cập nhật profile, đổi mật khẩu, đăng xuất.
- Instructor/Admin: danh sách, tạo, sửa, upload thumbnail, publish/unpublish và xóa khóa học.
- Admin: danh sách, tạo, sửa và xóa category.
- Access token lưu trong SecureStore; API client tự thử refresh token một lần khi nhận `401`.
- Điều hướng và màn hình quản trị được giới hạn theo role.

## Cấu hình API

Sao chép `.env.example` thành `.env` rồi chọn URL phù hợp:

```env
# Android Emulator
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api/v1

# Điện thoại thật (thay bằng IPv4 của máy chạy Docker)
# EXPO_PUBLIC_API_URL=http://192.168.1.10:3000/api/v1
```

Backend chạy bằng Docker và publish cổng `3000`. Điện thoại và máy tính phải cùng mạng Wi-Fi; Windows Firewall phải cho phép cổng này.

## Chạy

Yêu cầu Node.js `>=20.19.4` (khuyến nghị Node.js 22 LTS).

```bash
cd mobile
npm install
npm run start
```

Sau đó nhấn `a` để mở Android Emulator hoặc quét QR bằng Expo Go. Nếu đổi `.env`, dừng Expo và chạy lại với cache sạch:

```bash
npx expo start --clear
```

## Chạy hoàn toàn bằng Docker

Cách nhanh nhất (tự nhận IP khi đổi Wi-Fi):

```powershell
cd C:\Users\tranm\OneDrive\Documents\lms-platform
.\start-mobile.ps1
```

Script sẽ tự cập nhật `MOBILE_HOST_IP`, `MOBILE_API_URL`, khởi động backend/mobile và hiển thị QR mới. Nhấn `Ctrl+C` chỉ dừng theo dõi log; container vẫn tiếp tục chạy.

Android Emulator dùng cấu hình mặc định:

```bash
docker compose up -d postgres backend frontend
docker compose up --build mobile
```

Giữ terminal mobile ở chế độ foreground để xem QR code và phím tắt của Expo. Nhấn `a` để mở Android Emulator.

Với điện thoại thật, PowerShell cần truyền IPv4 LAN của máy tính (điện thoại và máy tính phải cùng Wi-Fi):

```powershell
$env:MOBILE_HOST_IP="192.168.1.10"
$env:MOBILE_API_URL="http://192.168.1.10:3000/api/v1"
docker compose up --build mobile
```

Thay `192.168.1.10` bằng IPv4 thực tế từ `ipconfig`.
