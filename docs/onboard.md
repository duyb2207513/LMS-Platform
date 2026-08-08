# LMS Platform – New Member Onboarding

Tài liệu này dành cho thành viên mới tham gia dự án LMS Platform. Hãy thực hiện lần lượt các bước bên dưới trước khi nhận task.

## 1. Tổng quan dự án

LMS Platform là website quản lý học tập trực tuyến với ba vai trò:

- **Student:** tìm kiếm, đăng ký và học khóa học.
- **Instructor:** tạo khóa học, bài học và quiz.
- **Admin:** quản lý người dùng, danh mục và nội dung.

## 2. Công nghệ sử dụng

### Backend

- Node.js và ExpressJS
- TypeScript
- Prisma ORM
- PostgreSQL
- Docker

### Frontend

- Vue 3
- TypeScript
- Vue Router
- Pinia
- Tailwind CSS
- Axios

### Testing

- Vitest
- Supertest
- Vue Test Utils
- Playwright

## 3. Cấu trúc repository

```text
lms-platform/
├── backend/              ExpressJS REST API
│   ├── prisma/           Database schema và migration
│   ├── src/modules/      Các module nghiệp vụ
│   ├── src/common/       Middleware, error và utility
│   └── tests/            Backend tests
├── frontend/             VueJS application
│   ├── src/features/     Các feature frontend
│   ├── src/components/   Component dùng chung
│   ├── src/router/       Vue Router
│   └── tests/            Frontend tests
├── docs/                 Tài liệu dự án
├── docker-compose.yml    Cấu hình các service
├── CONTRIBUTING.md       Quy tắc đóng góp code
└── README.md             Giới thiệu và cách chạy nhanh
```

## 4. Chuẩn bị môi trường

Cần cài đặt:

- Git
- Docker Desktop
- Visual Studio Code hoặc IDE tương đương

Kiểm tra:

```bash
git --version
docker --version
docker compose version
```

Node.js trên máy không bắt buộc nếu toàn bộ lệnh Node được chạy trong Docker.

## 5. Clone repository

Chấp nhận lời mời cộng tác trên GitHub, sau đó chạy:

```bash
git clone <GITHUB_REPOSITORY_URL>
cd lms-platform
```

Chuyển sang branch phát triển:

```bash
git switch develop
git pull origin develop
```

Không code trực tiếp trên `main` hoặc `develop`.

## 6. Cấu hình biến môi trường

Tạo file `backend/.env` dựa trên `backend/.env.example`:

```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/lms_db
```

Không commit `.env`, password, token hoặc secret lên GitHub.

## 7. Chạy project

Build và chạy các container:

```bash
docker compose up -d --build
```

Kiểm tra trạng thái:

```bash
docker compose ps
```

Các địa chỉ local:

| Thành phần    | Địa chỉ                             |
| ------------- | ----------------------------------- |
| Frontend      | http://localhost:5173               |
| Backend       | http://localhost:3000               |
| Health API    | http://localhost:3000/api/v1/health |
| Swagger       | http://localhost:3000/api-docs      |
| Prisma Studio | http://localhost:5555               |

Xem log:

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

Dừng project:

```bash
docker compose down
```

Không chạy `docker compose down -v` trừ khi thật sự muốn xóa dữ liệu database local.

## 8. Database và Prisma

Chạy migration hiện có:

```bash
docker compose run --rm backend npx prisma migrate dev
```

Sinh Prisma Client:

```bash
docker compose run --rm backend npx prisma generate
```

Khi thay đổi database:

1. Cập nhật `backend/prisma/schema.prisma`.
2. Chạy `npx prisma format`.
3. Chạy `npx prisma validate`.
4. Tạo migration mới với tên mô tả rõ thay đổi.
5. Commit cả `schema.prisma` và thư mục migration mới.

Ví dụ:

```bash
docker compose run --rm backend npx prisma format
docker compose run --rm backend npx prisma validate
docker compose run --rm backend npx prisma migrate dev --name add_course_tables
docker compose run --rm backend npx prisma generate
```

Không chỉnh sửa hoặc xóa migration cũ đã được merge.

## 9. Đọc tài liệu trước khi nhận task

Thành viên mới cần đọc:

```text
README.md
docs/requirements.md
docs/user-flow.md
docs/database.md
docs/api.md
docs/sprints/sprint-1.md
```

Mục đích:

- `requirements.md`: hiểu chức năng và quyền của từng role.
- `user-flow.md`: hiểu luồng sử dụng hệ thống.
- `database.md`: hiểu bảng và quan hệ.
- `api.md`: hiểu API contract.
- `sprint-1.md`: biết task hiện tại và mức ưu tiên.

## 10. Nhận task

Trước khi bắt đầu:

1. Đọc task trên GitHub Issues hoặc Project Board.
2. Đọc acceptance criteria.
3. Kiểm tra API contract liên quan.
4. Xác nhận task chưa có người thực hiện.
5. Tự gán task cho bản thân hoặc báo với người quản lý sprint.

Ví dụ task backend:

```text
[BE][Auth] Create register API
```

Acceptance criteria mẫu:

- Email không được trùng.
- Password được hash.
- User mới có role `STUDENT`.
- Thành công trả HTTP 201.
- Có integration test.

Ví dụ task frontend:

```text
[FE][Auth] Create register page
```

Acceptance criteria mẫu:

- Form có full name, email, password và confirm password.
- Có validation.
- Có loading và error state.
- Gửi request đúng API contract.
- Thành công chuyển đến trang login.

## 11. Tạo branch

Cập nhật `develop`:

```bash
git switch develop
git pull origin develop
```

Tạo branch từ `develop`:

```bash
git switch -c feature/auth-register-api
```

Quy tắc đặt tên:

```text
feature/<tên-chức-năng>
fix/<tên-lỗi>
test/<tên-test>
docs/<tên-tài-liệu>
```

Ví dụ:

```text
feature/auth-register-api
feature/auth-register-ui
feature/course-list-api
feature/course-list-ui
fix/auth-expired-token
test/course-integration
```

Không dùng tên chung chung như `test1`, `branch-moi`, `final` hoặc tên cá nhân.

## 12. Phạm vi chỉnh sửa

### Người làm Backend

Chủ yếu chỉnh sửa:

```text
backend/
docs/api.md
```

Backend chịu trách nhiệm:

- Database và Prisma.
- REST API.
- Validation phía server.
- Authentication và authorization.
- Integration test.
- Cập nhật Swagger/API contract.

### Người làm Frontend

Chủ yếu chỉnh sửa:

```text
frontend/
```

Frontend chịu trách nhiệm:

- Vue page và component.
- Form validation.
- Router và route guard.
- Pinia và Axios.
- Loading, empty và error state.
- Component test.

### File dùng chung

Cần trao đổi trước khi sửa:

```text
docker-compose.yml
README.md
docs/api.md
```

Không tự ý thay đổi request hoặc response đã thống nhất.

## 13. API contract

Trước mỗi feature, Backend và Frontend phải thống nhất:

- URL và HTTP method.
- Request body, params và query.
- Response thành công.
- Response thất bại.
- Có cần đăng nhập không.
- Role nào được phép gọi.
- Status code.

API contract nằm tại:

```text
docs/api.md
```

Hoặc Swagger:

```text
http://localhost:3000/api-docs
```

Trong lúc Backend làm API, Frontend có thể dùng mock data có cấu trúc đúng contract. Khi API hoàn thành, Frontend thay mock bằng lời gọi Axios.

## 14. Commit code

Kiểm tra thay đổi:

```bash
git status
git diff
```

Thêm file và commit:

```bash
git add .
git commit -m "feat(auth): add register API"
```

Quy tắc commit:

| Type       | Ý nghĩa                               |
| ---------- | ------------------------------------- |
| `feat`     | Thêm chức năng                        |
| `fix`      | Sửa lỗi                               |
| `test`     | Thêm hoặc sửa test                    |
| `docs`     | Cập nhật tài liệu                     |
| `refactor` | Sắp xếp lại code, không đổi chức năng |
| `chore`    | Cấu hình hoặc công việc bảo trì       |
| `style`    | Format code, không đổi logic          |

Ví dụ:

```text
feat(auth): add register endpoint
feat(course): add course creation form
fix(auth): handle expired access token
test(course): add course integration tests
docs(api): document login endpoint
chore(docker): add frontend service
```

Không dùng commit message như `update`, `fix`, `code mới` hoặc `final`.

## 15. Push và tạo Pull Request

Push branch:

```bash
git push -u origin feature/auth-register-api
```

Tạo Pull Request:

```text
feature/auth-register-api → develop
```

Không tạo Pull Request trực tiếp vào `main`.

Pull Request cần ghi:

```markdown
## Task

[BE][Auth] Create register API

## Changes

- Added register route.
- Added request validation.
- Added password hashing.
- Added integration test.

## How to test

POST /api/v1/auth/register

## Test result

All authentication tests passed.
```

Nếu thay đổi giao diện, đính kèm screenshot. Nếu thay đổi database, ghi rõ migration mới.

## 16. Cập nhật `develop` vào feature branch

Nếu thành viên khác vừa merge code mới:

```bash
git add .
git commit -m "feat(auth): build register form"

git switch develop
git pull origin develop

git switch feature/auth-register-ui
git merge develop
```

Giải quyết conflict nếu có, kiểm tra lại project rồi tiếp tục làm việc.

## 17. Definition of Done

Task chỉ được chuyển sang `Done` khi:

- Đúng acceptance criteria.
- Không có TypeScript error.
- Validation hoạt động.
- Authentication và authorization đúng.
- Frontend có loading và error state.
- Test liên quan chạy thành công.
- API documentation được cập nhật.
- Không commit `.env` hoặc secret.
- Pull Request đã được review.
- Code đã merge vào `develop`.

## 18. Khi gặp lỗi

Khi nhờ hỗ trợ, cần cung cấp:

- Lệnh đã chạy.
- Toàn bộ error message.
- File hoặc module liên quan.
- Branch hiện tại.
- Các bước đã thử.

Các lệnh kiểm tra cơ bản:

```bash
git status
git branch
docker compose ps
docker compose logs backend
docker compose logs frontend
```

Không tự ý xóa database, migration hoặc Docker volume khi chưa trao đổi với team.

## 19. Checklist thành viên mới

- [ ] Chấp nhận GitHub invitation.
- [ ] Đọc `README.md` và tài liệu onboarding.
- [ ] Clone repository.
- [ ] Chuyển sang `develop`.
- [ ] Tạo `backend/.env`.
- [ ] Chạy `docker compose up -d --build`.
- [ ] Mở được frontend.
- [ ] Health API trả HTTP 200.
- [ ] Mở được Swagger.
- [ ] Đọc requirements, ERD và API contract.
- [ ] Nhận một task nhỏ đầu tiên.
- [ ] Tạo feature branch.
- [ ] Commit đúng convention.
- [ ] Push branch.
- [ ] Tạo Pull Request vào `develop`.
- [ ] Nhận review và cập nhật code nếu cần.

## 20. Task đầu tiên đề xuất

Không nên giao ngay module phức tạp. Một số task phù hợp:

### Frontend

```text
[FE][Common] Create EmptyState component
[FE][Course] Create CourseCard with mock data
```

### Backend

```text
[BE][System] Add GET /api/v1/health/database
[BE][Category] Add GET /api/v1/categories
```

### Testing

```text
[TEST][System] Add test for GET /api/v1/health
```

Task đầu tiên dùng để xác nhận thành viên mới có thể chạy project, hiểu cấu trúc thư mục, tạo branch, commit, push và tạo Pull Request đúng quy trình.
