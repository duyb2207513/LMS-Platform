# 🚀 Hướng Dẫn Triển Khai (Deploy) Hệ Thống LMS Platform từ Localhost lên Cloud

Tài liệu này hướng dẫn chi tiết từ **khởi chạy, kiểm thử ở máy Local (Docker)** cho đến **triển khai toàn bộ hệ thống lên Cloud miễn phí (0 VNĐ)**:
- **Frontend:** Vercel (Vue 3 + Vite + Tailwind CSS)
- **Backend:** Render.com (Node.js 22 Express + TypeScript + Prisma 7 ORM)
- **Database:** Supabase (PostgreSQL 17 Singapore Region)
- **Media & File Storage:** Cloudinary (Lưu trữ ảnh Avatar, Thumbnail, File bài nộp)
- **AI Assistant:** Google AI Studio (Gemini 2.0 Flash)
- **Authentication:** Google Identity Services & GitHub OAuth 2.0

---

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────────────┐
│                     1. FRONTEND (Vercel)                        │
│                   Vue 3 + Vite + Pinia + SPA                    │
│             https://lms-platform-lemon-theta.vercel.app         │
└────────────────────────────────┬────────────────────────────────┘
                                 │ (HTTPS / REST API + WebSocket)
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     2. BACKEND (Render)                         │
│               Node.js 22 Express + Docker Container             │
│              https://lms-platform-5rwf.onrender.com             │
└───────┬────────────────────────┬────────────────────────┬───────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  3. DATABASE     │   │ 4. FILE STORAGE  │   │  5. AI ASSISTANT │
│   (Supabase)     │   │   (Cloudinary)   │   │  (Google AI)     │
│  PostgreSQL 17   │   │  Avatar, Thumb,  │   │  Gemini 2.0      │
│  Session/Pooler  │   │  Assignment Files│   │  Flash Agent     │
└──────────────────┘   └──────────────────┘   └──────────────────┘
```

---

## 📋 Bảng Tổng Hợp Biến Môi Trường (Environment Variables)

### 1. Biến môi trường Backend (Khai báo trên Render & `backend/.env`)

| Tên biến (Key) | Bắt buộc | Mô tả & Giá trị mẫu |
| :--- | :---: | :--- |
| `NODE_ENV` | **Có** | `production` (hoặc `development` khi chạy local) |
| `PORT` | **Có** | `3000` |
| `DATABASE_URL` | **Có** | Chuỗi kết nối PostgreSQL Supabase: `postgresql://postgres.xxx:Pass@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `JWT_ACCESS_SECRET` | **Có** | Chuỗi ngẫu nhiên bảo mật: `lms-access-secret-production-key-2026` |
| `JWT_REFRESH_SECRET` | **Có** | Chuỗi ngẫu nhiên bảo mật: `lms-refresh-secret-production-key-2026` |
| `FRONTEND_URL` | **Có** | URL Frontend chính thức: `https://lms-platform-lemon-theta.vercel.app` *(Không có dấu `/` ở cuối)* |
| `CLOUDINARY_CLOUD_NAME` | **Có** | Cloud Name từ Cloudinary Dashboard (ví dụ: `dxyzk1234`) |
| `CLOUDINARY_API_KEY` | **Có** | API Key từ Cloudinary Dashboard (ví dụ: `123456789012345`) |
| `CLOUDINARY_API_SECRET` | **Có** | API Secret từ Cloudinary Dashboard (ví dụ: `AbCdEfGhIjKlMnOp...`) |
| `GOOGLE_CLIENT_ID` | Tùy chọn | Google OAuth Client ID (ví dụ: `456249048931-xxx.apps.googleusercontent.com`) |
| `GITHUB_CLIENT_ID` | Tùy chọn | GitHub OAuth Client ID |
| `GITHUB_CLIENT_SECRET` | Tùy chọn | GitHub OAuth Client Secret |
| `GITHUB_CALLBACK_URL` | Tùy chọn | `https://lms-platform-5rwf.onrender.com/api/v1/auth/github/callback` |
| `GEMINI_API_KEY` | Tùy chọn | API Key từ Google AI Studio (ví dụ: `AIzaSyD1heMfTjge...`) |
| `GEMINI_MODEL` | Tùy chọn | `gemini-2.0-flash` |
| `RATE_LIMIT_MAX` | Tùy chọn | `300` |
| `AUTH_RATE_LIMIT_MAX` | Tùy chọn | `20` |

### 2. Biến môi trường Frontend (Khai báo trên Vercel)

| Tên biến (Key) | Bắt buộc | Mô tả & Giá trị mẫu |
| :--- | :---: | :--- |
| `VITE_API_BASE_URL` | **Có** | URL Backend Render kèm `/api/v1`: `https://lms-platform-5rwf.onrender.com/api/v1` |
| `VITE_GOOGLE_CLIENT_ID` | Tùy chọn | Google OAuth Client ID (trùng với backend) |

---

## 🛠️ Hướng Dẫn Chi Tiết Từng Bước (Từ Local Đến Cloud)

### BƯỚC 1: Khởi Tạo Các Dịch Vụ Cloud Miễn Phí

#### 1.1 Tạo Database trên Supabase (PostgreSQL)
1. Đăng ký/Đăng nhập [supabase.com](https://supabase.com).
2. Tạo New Project:
   * **Name:** `lms-database`
   * **Database Password:** Đặt mật khẩu an toàn (ví dụ: `MyStrongPass123!@#`).
   * **Region:** `Southeast Asia (Singapore)`.
3. Lấy Connection String:
   * Vào **Project Settings** ➔ **Database** ➔ Cuộn xuống **Connection string** ➔ Chọn tab **URI**.
   * Chọn chế độ **Transaction (port 6543)** hoặc **Session (port 5432)** và copy chuỗi kết nối:
     ```text
     postgresql://postgres.ckdntlkhwalaggjwinik:MyStrongPass123!@#@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
     ```

#### 1.2 Tạo Kho Lưu Trữ File trên Cloudinary
1. Đăng ký tài khoản miễn phí tại [cloudinary.com](https://cloudinary.com).
2. Tại trang **Dashboard (Console)**, lưu lại 3 thông số:
   * **Cloud Name**
   * **API Key**
   * **API Secret**

#### 1.3 Tạo API Key AI Assistant trên Google AI Studio
1. Truy cập [aistudio.google.com](https://aistudio.google.com).
2. Bấm **Get API Key** ➔ **Create API Key**.

#### 1.4 Tạo Google OAuth Client ID (Cho Đăng Nhập Google)
1. Vào [Google Cloud Console ➔ Credentials](https://console.cloud.google.com/apis/credentials).
2. Tạo **OAuth 2.0 Client ID** (Application type: **Web application**).
3. **Authorized JavaScript origins:**
   * `http://localhost:5173`
   * `https://lms-platform-lemon-theta.vercel.app`
   * `https://lms-platform-git-develop-11-lms-platform.vercel.app` *(hoặc domain preview Vercel)*
4. **Authorized redirect URIs:**
   * `http://localhost:5173`
   * `https://lms-platform-lemon-theta.vercel.app`
5. Copy **Client ID** để cấu hình cho Frontend & Backend.

#### 1.5 Tạo GitHub OAuth App (Cho Đăng Nhập GitHub)
1. Vào **GitHub Settings** ➔ **Developer Settings** ➔ **OAuth Apps** ➔ **New OAuth App**.
2. **Homepage URL:** `https://lms-platform-lemon-theta.vercel.app`
3. **Authorization callback URL:**
   ```text
   https://lms-platform-5rwf.onrender.com/api/v1/auth/github/callback
   ```
4. Lưu lại **Client ID** và tạo **Client Secret**.

---

### BƯỚC 2: Đồng Bộ Database & Chạy Kiểm Thử Dưới Localhost

Mở terminal tại máy tính của bạn:

```powershell
# 1. Khởi động các container dưới local (Database local, Backend, Frontend)
docker compose up -d

# 2. Đẩy cấu trúc bảng (Migration) lên Supabase
docker compose exec backend npx prisma migrate deploy

# 3. Nạp dữ liệu mẫu ban đầu (Admin, Giảng viên, Khóa học mẫu)
docker compose exec backend npm run db:seed

# 4. Chạy toàn bộ Unit Tests & Integration Tests để đảm bảo hệ thống hoàn hảo
docker compose exec backend npm test
docker compose exec backend npm run test:integration
```

---

### BƯỚC 3: Đẩy Toàn Bộ Mã Nguồn Lên GitHub

```powershell
# Kiểm tra nhánh hiện tại
git status

# Thêm tất cả thay đổi và commit
git add .
git commit -m "feat: complete cloud deployment configuration"

# Đẩy code lên nhánh develop / main
git push origin develop
```

---

### BƯỚC 4: Triển Khai Backend Lên Render.com (Docker Web Service)

1. Truy cập [render.com](https://render.com) ➔ Đăng nhập bằng GitHub.
2. Bấm nút **New +** ➔ Chọn **Web Service**.
3. Chọn Repository `duyb2207513/LMS-Platform`.
4. Cấu hình các thông số cơ bản:
   * **Name:** `lms-backend`
   * **Region:** `Singapore (Southeast Asia)`
   * **Branch:** `develop` *(hoặc nhánh chứa code mới nhất của bạn)*
   * **Root Directory:** `backend`
   * **Runtime:** `Docker`
   * **Instance Type:** `Free`
5. Cuộn xuống mục **Environment Variables**, bấm **Add Environment Variable** và thêm đầy đủ các biến ở **Bảng Biến Môi Trường Backend**.
6. Bấm **Create Web Service**.
7. *(Khắc phục cache nếu cần)*: Bấm **Manual Deploy** ➔ **Clear build cache & deploy** để Render build sạch từ Dockerfile.
8. Sau 1-2 phút, Render sẽ cấp URL Backend cho bạn:
   `https://lms-platform-5rwf.onrender.com`

---

### BƯỚC 5: Triển Khai Frontend Lên Vercel

1. Truy cập [vercel.com](https://vercel.com) ➔ Đăng nhập bằng GitHub.
2. Bấm **Add New...** ➔ **Project** ➔ Chọn repository `LMS-Platform`.
3. Cấu hình Project:
   * **Framework Preset:** `Vite`
   * **Root Directory:** Bấm **Edit** và chọn `frontend`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
4. Mở rộng mục **Environment Variables**:
   * `VITE_API_BASE_URL`: `https://lms-platform-5rwf.onrender.com/api/v1`
   * `VITE_GOOGLE_CLIENT_ID`: `<Google Client ID của bạn>`
5. Bấm nút **Deploy**.
6. Vercel sẽ cấp URL Frontend chính thức (ví dụ: `https://lms-platform-lemon-theta.vercel.app`).

---

### BƯỚC 6: Đồng Bộ Khóa Chéo Hoàn Tất (Final Sync)

1. Mở lại **Render.com** ➔ Chọn service `lms-backend` ➔ **Environment**.
2. Kiểm tra biến `FRONTEND_URL` đã trỏ đúng domain Vercel:
   ```env
   FRONTEND_URL="https://lms-platform-lemon-theta.vercel.app"
   ```
3. Lưu lại để Render tự động cập nhật CORS.

---

## ✅ Checklist Kiểm Thử Nghiệm Thu (QA Checklist)

- [ ] **1. Đăng ký & Đăng nhập Email:** Đăng ký tài khoản mới, kiểm tra JWT access token.
- [ ] **2. Đăng nhập Google & GitHub:** Bấm icon đăng nhập xã hội, kiểm tra popup và đăng nhập thành công.
- [ ] **3. Khám phá Khóa học:** Danh sách khóa học load trực tiếp từ Supabase PostgreSQL không bị lỗi 500/400.
- [ ] **4. Upload File lên Cloudinary:** Thử cập nhật ảnh đại diện (Avatar) hoặc upload Thumbnail khóa học, kiểm tra ảnh hiển thị trực tiếp từ CDN `res.cloudinary.com`.
- [ ] **5. Trợ lý AI (Gemini Flash):** Mở chat widget màu tím góc dưới, hỏi câu hỏi tìm khóa học.
- [ ] **6. Học tập & Làm bài tập:** Mở bài học, xem video, làm quiz và nộp file bài tập (PDF/DOCX).
- [ ] **7. F5 Refresh Trang (SPA Routing):** Bấm F5 ở các trang `/courses`, `/dashboard`, `/messages` để xác nhận không bị lỗi 404 Vercel.

---

## 🛠️ Xử Lý Sự Cố Thường Gặp (Troubleshooting)

### 1. Backend Render bị ngủ (Cold Start) ở lượt truy cập đầu tiên
* **Hiện tượng:** Request đầu tiên sau 15 phút không hoạt động mất 30–50 giây.
* **Khắc phục:** Sử dụng dịch vụ ping miễn phí như [UptimeRobot](https://uptimerobot.com) hoặc [Cron-Job.org](https://cron-job.org) để gửi request `GET https://lms-platform-5rwf.onrender.com/api/v1/health/ready` mỗi 10 phút một lần nhằm giữ Backend luôn thức 24/7.

### 2. Lỗi `Cannot find module '/app/dist/server.js'` khi Render build Docker
* **Nguyên nhân:** Render lưu cache layer Docker cũ.
* **Khắc phục:** Trên Render Dashboard, bấm **Manual Deploy** ➔ chọn **Clear build cache & deploy**.

### 3. Lỗi `MIME type of text/html` khi tải module script trên Vercel
* **Nguyên nhân:** Trình duyệt lưu cache file `index.html` cũ khi vừa có bản deploy mới.
* **Khắc phục:** Nhấn `Ctrl + Shift + R` để xóa cache trình duyệt. Dự án đã được cấu hình sẵn header `Cache-Control: no-cache` và router auto-reload trong `vercel.json` để tự động xử lý.
