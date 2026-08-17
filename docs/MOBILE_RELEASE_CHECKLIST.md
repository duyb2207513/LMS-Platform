# Mobile release checklist

## 1. Kiểm tra tự động

```bash
cd mobile
npm ci
npm run check
npx expo export --platform ios
npx expo export --platform android
```

Các luồng E2E mẫu cho login, admin moderation và instructor gradebook nằm trong `mobile/e2e/` và có thể chạy bằng Maestro sau khi cài development build.

## 2. Expo và push notification

1. Đăng nhập Expo: `npx eas-cli@latest login`.
2. Liên kết project: `npx eas-cli@latest init`.
3. Chép `projectId` do EAS tạo vào `EXPO_PUBLIC_EAS_PROJECT_ID` của môi trường local/preview.
4. Tạo development build: `npx eas-cli@latest build --profile development --platform ios` hoặc `android`.
5. Cấu hình APNs/FCM theo hướng dẫn EAS credentials rồi test trên thiết bị thật.

Push remote không được xem là đã kiểm thử nếu chỉ chạy Expo Go. Cần development/preview build có native module và credentials.

## 3. Sentry

- Tạo project React Native trên Sentry.
- Lưu `EXPO_PUBLIC_SENTRY_DSN` trong EAS environment.
- Lưu `SENTRY_AUTH_TOKEN` dạng secret để upload source map.
- Khai báo thêm `SENTRY_ORG` và `SENTRY_PROJECT` trong EAS environment để plugin gắn đúng project.
- Tạo preview build, gây một lỗi thử có kiểm soát và xác nhận stack trace đã được symbolicate.

## 4. Store metadata và quyền riêng tư

- Chuẩn bị icon, splash, ảnh chụp màn hình iPhone/iPad/Android và mô tả tiếng Việt.
- Khai báo dữ liệu thu thập: tài khoản, email, nội dung người dùng, lịch sử mua hàng, usage analytics và diagnostics.
- Công bố URL Privacy Policy, Terms of Service và trang hỗ trợ/xóa tài khoản.
- Giải thích quyền Photos/Files và Notifications; không xin quyền trước khi người dùng cần dùng tính năng.
- Kiểm tra deep link `lmsplatform://`, đăng nhập OAuth, payment callback và notification tap trên bản release.

## 5. Build

```bash
cd mobile
npm run build:preview:android
npm run build:preview:ios
npm run build:production
```

`eas.json` tự tăng build number ở profile production. Việc submit lên App Store/Google Play vẫn cần tài khoản developer và signing credentials của chủ dự án.
