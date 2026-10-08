# Cheatsheet: Git & Docker cho dự án eFORM.VJU

Tài liệu này tổng hợp các lệnh thường xuyên sử dụng nhất trong quy trình làm việc hàng ngày với Git (Quản lý mã nguồn) và Docker (Triển khai môi trường).

---

## 🟢 1. QUY TRÌNH LÀM VIỆC VỚI GIT & GITHUB

**Quy tắc tối thượng:**
- TUYỆT ĐỐI KHÔNG commit hay push thẳng lên nhánh `main`.
- Mọi nhánh làm việc MỚI đều phải được tạo ra từ nhánh `develop`.
- Khi xong việc, push nhánh lên GitHub và tạo Pull Request (PR) vào `develop`.

### 1.1. Bắt đầu một ngày làm việc (Hoặc tạo tính năng mới)
Mở terminal, đảm bảo bạn đang ở trong thư mục `eFORM.VJU`:

```bash
# 1. Chuyển về nhánh develop
git checkout develop

# 2. Lấy code mới nhất từ team về máy (rất quan trọng để tránh conflict)
git pull origin develop

# 3. Tạo nhánh làm việc mới từ develop (Quy tắc đặt tên bên dưới)
git checkout -b feature/TEN_TICKET-mo-ta-ngan
```

**Quy tắc đặt tên nhánh:**
- `feature/<id>-<mô tả>` : Dành cho tính năng mới (Vd: `feature/PROJ-102-login`)
- `bugfix/<id>-<mô tả>` : Sửa lỗi thông thường (Vd: `bugfix/PROJ-103-fix-ui`)
- `hotfix/<id>-<mô tả>` : Sửa lỗi khẩn cấp từ production
- `chore/` hoặc `refactor/`: Cấu hình, tái cấu trúc code (Vd: `chore/update-lib`)

### 1.2. Lưu lại công việc và Đẩy code lên mạng (Push)

```bash
# 1. Xem các file nào đã bị thay đổi
git status

# 2. Đưa tất cả file thay đổi vào danh sách chuẩn bị lưu
git add .

# 3. Lưu lại (Commit) với lời nhắn rõ ràng
git commit -m "feat: hoàn thiện giao diện đăng nhập"

# 4. Đẩy nhánh này lên GitHub
# (Nếu là LẦN ĐẦU TIÊN đẩy nhánh này, cần thêm -u origin)
git push -u origin feature/TEN_TICKET-mo-ta-ngan

# (Từ LẦN THỨ 2 trở đi trên cùng nhánh này, chỉ cần gõ:)
git push
```
*(Sau đó lên trang web GitHub để tạo Pull Request)*

### 1.3. Các lệnh Git "Cứu hộ" thường dùng
```bash
# Xem mình đang ở nhánh nào
git branch

# Bỏ qua toàn bộ các thay đổi chưa commit, đưa file về trạng thái gốc
git restore . 
# hoặc
git checkout -- .
```

---

## 🐳 2. QUY TRÌNH LÀM VIỆC VỚI DOCKER

Dự án đã được cấu hình sẵn môi trường qua file `docker-compose.yml`. Bạn chỉ cần cài Docker Desktop trên máy và sử dụng các lệnh sau:

### 2.1. Khởi động dự án
```bash
# Khởi chạy tất cả các dịch vụ (Database, Backend, Frontend...) chạy ngầm (-d)
docker compose up -d

# Khởi chạy nhưng ép build lại ảnh (image) nếu có thay đổi trong file Dockerfile / pom.xml / package.json
docker compose up -d --build
```

### 2.2. Kiểm tra trạng thái & Log
```bash
# Xem danh sách các container đang chạy
docker compose ps

# Xem log của toàn bộ hệ thống
docker compose logs -f

# Xem log của MỘT dịch vụ cụ thể (vd: backend, frontend, db)
docker compose logs -f <tên_service_trong_docker_compose>
```

### 2.3. Tắt dự án
```bash
# Tắt tất cả các dịch vụ
docker compose down

# Tắt và xóa luôn cả dữ liệu (volume) trong database (CẨN THẬN)
docker compose down -v
```

### 2.4. Thực thi lệnh bên trong Container đang chạy
Đôi khi bạn cần chui vào bên trong máy chủ ảo của Docker để kiểm tra:
```bash
docker exec -it <tên_container> /bin/bash
# (hoặc dùng /bin/sh tuỳ hệ điều hành của container)
```
