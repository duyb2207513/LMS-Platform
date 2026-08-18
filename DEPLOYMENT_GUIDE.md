# Hướng Dẫn Triển Khai (Deploy) Hệ Thống LMS Platform 100% Miễn Phí

Tài liệu này hướng dẫn chi tiết từng bước để triển khai toàn bộ hệ thống **LMS Platform (Vue 3 + Node.js Express + PostgreSQL + AI Assistant)** lên môi trường Cloud hoàn toàn **miễn phí (0 VNĐ)** với hiệu năng cao, bảo mật và chứng chỉ SSL/HTTPS tự động.

---

## 🏗️ Kiến Trúc Triển Khai

```
┌────────────────────────────────┐
│      1. FRONTEND (Vercel)      │
│     Vue 3 + Vite + Tailwind    │
│  https://your-lms.vercel.app   │
└───────────────┬────────────────┘
                │ (HTTPS / REST API)
                ▼
┌────────────────────────────────┐       ┌────────────────────────────────┐
│      2. BACKEND (Render)       │ ────► │     3. DATABASE (Supabase)     │
│   Node.js Express + Prisma     │       │    PostgreSQL (500MB Free)     │
│ https://your-api.onrender.com  │       └────────────────────────────────┘
└───────────────┬────────────────┘
                │
                ├──────────────────────► ┌────────────────────────────────┐
                │                        │    4. FILE STORAGE (Cloudinary)│
                │                        │       Ảnh, Avatar, PDF, Docs   │
                │                        └────────────────────────────────┘
                │
                └──────────────────────► ┌────────────────────────────────┐
                                         │  5. AI ASSISTANT (AI Studio)   │
                                         │      Gemini 2.0 Flash Agent    │
                                         └────────────────────────────────┘
```

---

## 📋 Bảng Tổng Hợp Dịch Vụ & Chi Phí

| Thành phần | Dịch vụ đề xuất | Gói miễn phí | Mục đích |
| :--- | :--- | :--- | :--- |
| **Frontend** | [Vercel](https://vercel.com) | Free Hobby | Host giao diện Vue 3 SPA, CDN toàn cầu siêu nhanh, HTTPS miễn phí. |
| **Backend** | [Render.com](https://render.com) | Free Web Service | Chạy API Server Node.js Express & WebSocket. |
| **Database** | [Supabase](https://supabase.com) | Free Tier (500MB) | Cơ sở dữ liệu PostgreSQL 24/7, hỗ trợ Prisma ORM. |
| **Media Storage** | [Cloudinary](https://cloudinary.com) | Free Tier (25GB) | Lưu trữ Avatar, Thumbnail khóa học, File PDF nộp bài. |
| **Video bài giảng** | [YouTube Unlisted](https://youtube.com) | Không giới hạn | Lưu trữ và phát video bài giảng 1080p/4K mượt mà. |
| **AI Assistant** | [Google AI Studio](https://aistudio.google.com) | Free Quota | Vận hành Trợ lý Học tập AI (Gemini 2.0 Flash). |

---

## 🚀 Hướng Dẫn Thực Hiện Từng Bước

### BƯỚC 1: Tạo Database PostgreSQL trên Supabase

1. Truy cập [supabase.com](https://supabase.com) và bấm **Sign In / Sign Up** bằng tài khoản GitHub.
2. Bấm **New Project** ➔ Chọn Organization của bạn.
3. Điền thông tin:
   * **Name:** `lms-database`
   * **Database Password:** *Nhập mật khẩu an toàn và ghi nhớ lại (ví dụ: `MyStrongPass123!@#`)*
   * **Region:** Chọn `Southeast Asia (Singapore)` để có tốc độ kết nối nhanh nhất về Việt Nam.
4. Sau khi khởi tạo xong (mất khoảng 1-2 phút):
   * Vào mục **Project Settings** (icon bánh răng ở menu bên trái) ➔ Chọn **Database**.
   * Cuộn xuống mục **Connection string** ➔ Chọn tab **URI** ➔ Chế độ **Session (port 5432)** hoặc **Transaction (port 6543)**.
   * Sao chép đường dẫn kết nối, thay `[YOUR-PASSWORD]` bằng mật khẩu đã tạo ở trên. Ví dụ:
     ```
     postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
     ```

---

### BƯỚC 2: Tạo Kho Lưu Trữ File trên Cloudinary

1. Truy cập [cloudinary.com](https://cloudinary.com) và đăng ký tài khoản miễn phí.
2. Tại trang **Dashboard**, bạn sẽ thấy mục **Product Environment Credentials**.
3. Lưu lại 3 thông số:
   * `Cloud Name` (ví dụ: `dxyzk1234`)
   * `API Key` (ví dụ: `123456789012345`)
   * `API Secret` (ví dụ: `AbCdEfGhIjKlMnOpQrStUvWxYz`)

---

### BƯỚC 3: Đồng Bộ Dữ Liệu Lên Database Mới (Migration & Seed)

Tại máy tính cục bộ của bạn, thực hiện di chuyển cấu trúc bảng và dữ liệu mẫu lên Supabase:

1. Mở file `backend/.env` trên máy, thay thế tạm thời `DATABASE_URL` bằng chuỗi kết nối Supabase từ Bước 1:
   ```env
   DATABASE_URL="postgresql://postgres.xxxx:mat_khau_cua_ban@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```
2. Mở terminal tại thư mục `backend` và chạy các lệnh:
   ```bash
   # 1. Tạo toàn bộ bảng trong database
   npx prisma migrate deploy

   # 2. Tạo client Prisma
   npx prisma generate

   # 3. Nạp dữ liệu mẫu ban đầu (tài khoản admin, giảng viên, khóa học mẫu)
   npm run db:seed
   ```

---

### BƯỚC 4: Đẩy Toàn Bộ Mã Nguồn Lên GitHub

1. Tạo một repository mới trên GitHub (ví dụ: `lms-platform`).
2. Mở terminal tại thư mục gốc dự án và push code:
   ```bash
   git add .
   git commit -m "feat: prepare production configuration and deployment guide"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/lms-platform.git
   git push -u origin main
   ```

---

### BƯỚC 5: Deploy Backend Lên Render.com

1. Truy cập [render.com](https://render.com) và đăng nhập bằng GitHub.
2. Bấm nút **New +** ở góc phải ➔ Chọn **Web Service**.
3. Chọn Repository `lms-platform` vừa tạo.
4. Cấu hình các thông số sau:
   * **Name:** `lms-backend` *(hoặc tên tùy chọn)*
   * **Region:** `Singapore (Southeast Asia)`
   * **Root Directory:** `backend`
   * **Runtime:** `Node`
   * **Build Command:**
     ```bash
     npm ci && npm run build && npx prisma generate
     ```
   * **Start Command:**
     ```bash
     npm run start
     ```
   * **Instance Type:** `Free`
5. Cuộn xuống mục **Environment Variables** và thêm các biến:

| Key | Value mẫu |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `DATABASE_URL` | *(Chuỗi kết nối Supabase từ Bước 1)* |
| `JWT_ACCESS_SECRET` | `lms-super-secret-access-token-key-2026` |
| `JWT_REFRESH_SECRET` | `lms-super-secret-refresh-token-key-2026` |
| `GEMINI_API_KEY` | `AIzaSyD1heMfTjge37DO4V7A3yAcxFjMYAlOzUo` |
| `GEMINI_MODEL` | `gemini-2.0-flash` |
| `CLOUDINARY_CLOUD_NAME` | *(Cloud Name từ Bước 2)* |
| `CLOUDINARY_API_KEY` | *(API Key từ Bước 2)* |
| `CLOUDINARY_API_SECRET` | *(API Secret từ Bước 2)* |
| `FRONTEND_URL` | `http://localhost:5173` *(Sẽ cập nhật lại ở Bước 7)* |

6. Bấm **Create Web Service**.
7. Chờ 2–3 phút để Render build xong. Sau khi hoàn tất, Render sẽ cấp cho bạn một đường dẫn API (ví dụ: `https://lms-backend-xxxx.onrender.com`).

---

### BƯỚC 6: Deploy Frontend Lên Vercel

1. Tạo file [`frontend/vercel.json`](file:///c:/Users/tranm/OneDrive/Documents/lms-platform/frontend/vercel.json) để hỗ trợ định tuyến SPA (tránh lỗi 404 khi F5):
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```
2. Commit và push file này lên GitHub:
   ```bash
   git add frontend/vercel.json
   git commit -m "chore: add vercel rewrite config for vue spa"
   git push origin main
   ```
3. Truy cập [vercel.com](https://vercel.com) ➔ Đăng nhập bằng GitHub.
4. Bấm **Add New...** ➔ Chọn **Project** ➔ Chọn repository `lms-platform`.
5. Cấu hình Project:
   * **Framework Preset:** `Vite`
   * **Root Directory:** Bấm **Edit** và chọn thư mục `frontend`.
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
6. Mở rộng mục **Environment Variables** và thêm:
   * `VITE_API_BASE_URL`: `https://lms-backend-xxxx.onrender.com/api/v1` *(Dán URL backend Render từ Bước 5 kèm `/api/v1`)*
7. Bấm nút **Deploy**.
8. Sau 1 phút, Vercel sẽ cung cấp link website chính thức của bạn (ví dụ: `https://lms-platform-xxxx.vercel.app`).

---

### BƯỚC 7: Cập Nhật Liên Kết Chéo & Hoàn Tất

1. Quay lại trang quản trị **Render.com** ➔ Vào service `lms-backend` ➔ Mục **Environment**.
2. Tìm biến `FRONTEND_URL` và đổi giá trị thành link Vercel chính thức:
   ```env
   FRONTEND_URL="https://lms-platform-xxxx.vercel.app"
   ```
3. Render sẽ tự động lưu và khởi động lại server.

---

## ✅ Danh Sách Kiểm Tra Nghiệm Thu (QA Checklist)

Sau khi hoàn tất, hãy truy cập vào trang web trên Vercel và thực hiện kiểm tra:

- [ ] **1. Đăng ký & Đăng nhập:** Tạo thử tài khoản học viên mới, kiểm tra đăng nhập và nhận JWT token.
- [ ] **2. Khám phá Khóa học:** Xem danh sách khóa học tải trực tiếp từ cơ sở dữ liệu Supabase.
- [ ] **3. Trợ lý AI (Gemini Flash):** Bấm vào icon chat màu tím ở góc dưới màn hình, hỏi thử các câu hỏi:
  - *"Tìm cho tôi các khóa học miễn phí"*
  - *"Nó gồm những bài gì?"* (Kiểm tra trí nhớ liên kết câu trước)
  - *"Chính sách hoàn tiền trong 24 giờ như thế nào?"*
- [ ] **4. Học tập:** Mở một bài giảng video, làm bài Quiz và nộp thử Assignment.
- [ ] **5. Điều hướng SPA:** Thử F5 (Refresh) tại các trang `/courses`, `/dashboard`, `/messages` để đảm bảo không bị lỗi 404.

---

## 🛠️ Xử Lý Sự Cố Thường Gặp (Troubleshooting)

### 1. Backend Render phản hồi chậm ở request đầu tiên (Cold Start)
* **Nguyên nhân:** Gói miễn phí của Render sẽ tạm dừng (Sleep) server sau 15 phút không có lượt truy cập.
* **Cách khắc phục:** Lượt truy cập đầu tiên sẽ mất khoảng 30–40 giây để server khởi động lại. Các request tiếp theo sẽ chạy với tốc độ bình thường (mili-giây). Có thể dùng các dịch vụ ping miễn phí như [UptimeRobot](https://uptimerobot.com) để ping URL backend mỗi 10 phút một lần nhằm giữ server luôn hoạt động.

### 2. Lỗi CORS khi gọi API từ Frontend
* **Nguyên nhân:** Biến `FRONTEND_URL` trên Render chưa khớp chính xác với domain Vercel.
* **Cách khắc phục:** Đảm bảo `FRONTEND_URL` trên Render là `https://ten-du-an.vercel.app` (không có dấu gạch chéo `/` ở cuối).

### 3. Lỗi 404 khi tải lại trang con trên Vercel
* **Nguyên nhân:** Chưa có file cấu hình rewrite cho Single Page Application.
* **Cách khắc phục:** Đảm bảo file `frontend/vercel.json` đã có mặt trong repository với nội dung rewrite về `/index.html`.
