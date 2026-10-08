# Báo Cáo Tiến Độ Dự Án E-DRL

**Thời gian cập nhật:** 03/10/2026

Dự án đang trong quá trình chuyển đổi kiến trúc sang **Spring Boot** cho Backend và sử dụng **Python** cho engine xử lý/ký số PDF.

## 1. Những thứ đã làm được

**Sprint 1:**
- **[HOÀN THÀNH] Task 1.1:** Docker Compose môi trường phát triển (PostgreSQL, MinIO).
- **[HOÀN THÀNH] Task 1.2:** Khởi tạo Backend Spring Boot.
- **[HOÀN THÀNH] Task 1.3:** Khởi tạo Frontend React + Vite (AntD, Zustand, Axios, React Router).
- **[HOÀN THÀNH] Task 1.4:** Tools — Khung Python `word-parser`.
- **[HOÀN THÀNH] Task 1.5:** CSDL — Migration & Seed.
- **[HOÀN THÀNH] Task 1.6 (Core):** Authentication & RBAC.
- **[HOÀN THÀNH] Task 1.7:** Khoa, Lớp & Danh bạ người dùng (API CRUD). Đã **hoàn thiện phần Import/Export Excel bằng Apache POI** (UserService) và GenericHibernateDao (truy vấn động Criteria).
- **[HOÀN THÀNH] Task 1.8:** Module 4 — Field Code Master (CRUD API).
- **[HOÀN THÀNH] Task 1.9:** Đăng nhập & App Shell (Form đăng nhập, Layout Header/Sidebar động theo Role, Redirect & Guard 401/403).

**Sprint 2:**
- **[HOÀN THÀNH] Task 2.1:** Học kỳ & Tiêu chí (CRUD `Semester`, `Criteria`).
- **[HOÀN THÀNH] Task 2.2:** Module 3 — Biểu mẫu & Versioning (Tạo, sửa, clone version, activate form JSON layout).
- **[HOÀN THÀNH] Task 2.3:** Module 7 — API soạn thảo phiếu (Editor: lấy form draft, save draft, tính điểm, submit & sign).
- **[HOÀN THÀNH] Task 2.4:** Module 6 — Notification Engine (CRUD Notification, đánh dấu đã đọc, tạo tự động khi submit form).
- **[HOÀN THÀNH] Task 2.5:** Audit helper (Tạo bảng audit_logs, service ghi nhận log).
- **[HOÀN THÀNH] Task 2.9:** Spike kỹ thuật PDF (`PythonRenderClient` kết nối backend, chèn ảnh chữ ký PDFBox `PdfSignatureEngine`, tài liệu `spike-pdf.md`).

**Sprint 3:**
- **[HOÀN THÀNH] Task 3.1 & 3.2:** Workflow State Machine & Hàng đợi duyệt (Pending Queue).
- **[HOÀN THÀNH] Task 3.3:** Duyệt cấp Lớp & Trả phiếu (Class Approve / Reject).
- **[HOÀN THÀNH] Task 3.5 & 3.6:** Engine PDF (PdfLockEngine, PdfHashEngine) và Duyệt lô cấp Khoa (Dean Approve Batch). Đã cấu hình Pipeline Render -> Ký -> Khóa -> Băm -> Upload MinIO.

**Sprint 4:**
- **[HOÀN THÀNH] Task 4.1 & 4.2:** Báo cáo tổng hợp toàn trường (`GET /reports/aggregate`) và Xuất Excel bằng Apache POI (`GET /reports/export-excel`).
- **[HOÀN THÀNH] Task 4.4:** Tra cứu công khai API (`GET /public/verify/{id}` và `POST /public/verify/{id}/check`).

## 2. Các lỗi và vấn đề còn tồn đọng chưa giải quyết
- **Lỗi môi trường Sandbox (Network/Docker socket):** Maven test failed do không thể connect mạng ở Sandbox.
- **Cấu hình JDK/Lombok:** Sandbox JVM mặc định là JDK 21 gây lỗi `TypeTag :: UNKNOWN` khi compile bằng Maven CLI với Lombok `1.18.34`.

## 3. Bước Tiếp Theo
- Tiếp tục hoàn thiện các UI màn hình Frontend (Danh bạ, Import Excel, Form Builder, Split-screen, Pending Queue).
- Bàn giao, triển khai Docker Compose trên môi trường Staging/Production.
- Thực hiện kiểm thử toàn diện E2E bằng Playwright.
