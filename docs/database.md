ERD là sơ đồ bảng và quan hệ database.

Trong Sprint 0, nên thiết kế toàn bộ database nhưng chỉ cần implement các bảng Sprint 1 trước:

```
users
categories
courses
```

Quan hệ:

```
User 1 ─── N Course
Category 1 ─── N Course
```

Ví dụ:

- Một Instructor tạo nhiều Course.
- Một Category chứa nhiều Course.
- Một Course chỉ thuộc một Category.

Kết quả task:

- Có danh sách cột của từng bảng.
- Có khóa chính và khóa ngoại.
- Có unique constraint.
- Có quan hệ giữa các bảng.
- Lưu sơ đồ hoặc mô tả vào `docs/database.md`.

Chưa cần tạo database ngay ở SP0-03. Task này chỉ là **thiết kế**; SP0-04 mới thực hiện bằng Prisma.