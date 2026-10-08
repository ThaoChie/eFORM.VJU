# HƯỚNG DẪN VẬN HÀNH & PHÁT TRIỂN VỚI DOCKER
## HỆ THỐNG E-FORM ĐIỂM RÈN LUYỆN ĐẠI HỌC (EF_DRL_DEV)

Tài liệu này cung cấp toàn bộ hướng dẫn khởi chạy, vận hành và phát triển hệ thống bằng Docker & Docker Compose.

---

## 1. Cấu trúc Thư mục Docker

```
EF_DRL_DEV/
├── docker-compose.yml          # Cấu hình Docker Compose chính (Production/Staging)
├── docker-compose.dev.yml      # Cấu hình Override cho môi trường Dev (Hot-Reload)
├── .env                        # Biến môi trường đang áp dụng
├── .env.example                # Mẫu biến môi trường
├── .dockerignore               # Danh sách loại trừ khi build root
├── database/
│   └── init.sql                # DDL 7 bảng quan hệ + Dữ liệu mẫu (Seed Data)
├── backend/
│   ├── Dockerfile              # Multi-stage Dockerfile cho Node.js Express
│   ├── .dockerignore           # Loại trừ node_modules, logs...
│   ├── package.json            # Quản lý dependencies backend
│   └── src/app.js              # Entrypoint server & Healthcheck
└── frontend/
    ├── Dockerfile              # Multi-stage Dockerfile (Vite build -> Nginx)
    ├── nginx.conf              # Cấu hình Nginx SPA & API Reverse Proxy
    ├── .dockerignore           # Loại trừ node_modules, dist...
    ├── package.json            # Quản lý dependencies frontend
    └── vite.config.js          # Cấu hình Vite & API Proxy
```

---

## 2. Thông tin Dịch vụ & Cổng truy cập

| Dịch vụ | Tên Container | Cổng Host | Cổng Nội bộ | Chức năng |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `drl_frontend` | `http://localhost:3000` | `80` (Prod) / `3000` (Dev) | Giao diện ReactJS (Vite + TailwindCSS) |
| **Backend API** | `drl_backend` | `http://localhost:5000` | `5000` | REST API (Express + pdf-lib + Multer) |
| **Database** | `drl_postgres_db` | `localhost:5432` | `5432` | PostgreSQL 16 Alpine |

---

## 3. Danh sách Tài khoản Kiểm thử Mặc định

Toàn bộ tài khoản mẫu đã được băm mật khẩu chuẩn bcrypt trong `database/init.sql`:

* **Mật khẩu chung cho tất cả tài khoản:** `password123`

| Vai trò (Role) | Họ và tên | Email đăng nhập | Quyền hạn chính |
| :--- | :--- | :--- | :--- |
| **ADMIN** | Quản trị viên Hệ thống | `admin@drl.edu.vn` | Quản trị người dùng, học kỳ, tiêu chí |
| **DEAN** | PGS.TS Trần Văn Hùng | `dean.cntt@drl.edu.vn` | Xem Dashboard khoa, ký số duyệt hàng loạt |
| **CLASS_LEADER** | Lê Hoàng Nam (Lớp trưởng) | `nam.le@student.drl.edu.vn` | Chấm điểm lớp, đối soát minh chứng, ký duyệt |
| **STUDENT** | Nguyễn Minh Trí | `tri.nguyen@student.drl.edu.vn` | Tự chấm điểm, nộp minh chứng, ký tay cá nhân |
| **STUDENT** | Phạm Quỳnh Anh | `anh.pham@student.drl.edu.vn` | Tự chấm điểm, nộp minh chứng, ký tay cá nhân |

---

## 4. Các Lệnh Khởi chạy & Vận hành

### 4.1. Chế độ Phát triển (Development Mode - Hỗ trợ Hot-Reload)
* Khi chỉnh sửa mã nguồn tại `backend/` hoặc `frontend/`, code sẽ được tự động đồng bộ và reload ngay lập tức trong container mà không cần build lại:

```bash
# Khởi động chế độ Development
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Hoặc chạy ngầm (Detached mode)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

### 4.2. Chế độ Hoàn chỉnh (Production / Staging Mode)
* Frontend được build tối ưu và phục vụ qua web server **Nginx Alpine**:

```bash
# Khởi động hệ thống
docker compose up -d --build

# Dừng hệ thống
docker compose down
```

---

## 5. Quản lý, Giám sát & Gỡ lỗi (Troubleshooting)

### 5.1. Xem log container theo thời gian thực
```bash
# Xem log toàn bộ hệ thống
docker compose logs -f

# Xem log riêng từng dịch vụ
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres_db
```

### 5.2. Kiểm tra trạng thái container và healthcheck
```bash
docker compose ps
```

### 5.3. Truy cập vào bên trong Container
```bash
# Truy cập vào terminal Backend
docker compose exec backend sh

# Truy cập vào PostgreSQL CLI
docker compose exec postgres_db psql -U postgres -d drl_eform_db
```

### 5.4. Khởi động lại hoặc xóa trắng dữ liệu để khởi tạo lại
```bash
# Dừng và xóa toàn bộ Volumes (Reset sạch dữ liệu Database và Uploads)
docker compose down -v

# Khởi động và tự động chạy lại init.sql từ đầu
docker compose up -d --build
```

---

## 6. Sao lưu & Phục hồi CSDL (Backup & Restore)

```bash
# 1. Export CSDL ra file .sql trên máy host
docker compose exec -T postgres_db pg_dump -U postgres drl_eform_db > backup_drl_$(date +%Y%m%d).sql

# 2. Phục hồi dữ liệu từ file backup .sql
cat backup_drl_20260911.sql | docker compose exec -T postgres_db psql -U postgres -d drl_eform_db
```
