# Tình trạng Dự án (Project Status) - E-DRL E-Form
*Cập nhật lần cuối: 03/10/2026*

## 1. Những phần đã hoàn thành
- **Nghiên cứu tài liệu (Business Context)**: Đã nắm bắt rõ ràng toàn bộ kiến trúc (Monorepo), quy trình thiết kế, các role của người dùng, cũng như kiến trúc bảo mật với PDF (Python Render, PDFBox, DocMDP, SHA-256).
- **Hoàn thành Task 1.9 (Đăng nhập & App Shell)** ở module Frontend (`frontend-react`):
  - **Quản lý State Xác thực (AuthStore)**: Đã tạo Zustand store lưu trữ Token và dữ liệu User qua `localStorage` để duy trì phiên làm việc.
  - **Phân quyền và Định tuyến (RBAC)**: Xây dựng cấu hình menu động (`permission-config.js`) và Route Guard (`ProtectedRoute.jsx`) để kiểm soát truy cập đối với 4 roles (`STUDENT`, `CLASS_LEADER`, `DEAN`, `ADMIN`).
  - **Axios Interceptor**: Đã xử lý bắt lỗi ở tầng HTTP Client (`client.js`) để tự động gắn token, tự động logout nếu server trả về `401 Unauthorized` và chuyển hướng nếu `403 Forbidden`.
  - **Giao diện Người dùng (UI)**: Xây dựng thành công `LoginPage` (có validate `react-hook-form` + `antd`), `UnauthorizedPage`, và `AppShell` Layout.
  - **Kết nối Routes**: Đã tích hợp các màn hình cơ bản bằng `react-router-dom` tại `App.jsx`.

## 2. Những lỗi còn tồn tại / Công việc chưa giải quyết
- **Lỗi kết nối Backend (Chưa hoàn thiện)**: Hiện tại, Frontend gọi API tới `/api/v1/auth/login` nhưng backend Spring Boot chưa triển khai. Cần thực hiện các Tasks từ 1.1 đến 1.8 (Thiết lập Docker, PostgreSQL, Khởi tạo cấu trúc Spring Boot, Seed data mẫu).
- **Setup Dependencies**: Dự án frontend chỉ mới có code, cần đảm bảo chạy lệnh `npm install` để cài đặt `zustand`, `axios`, `antd`, `react-hook-form`, `react-router-dom` vào `package.json` mới có thể khởi chạy `npm run dev`.
- **Cấu hình biến môi trường**: File `.env` chưa có (cần mapping `VITE_API_BASE_URL` cho Axios Client).
- **Các tính năng tiếp theo của Sprint 1**: Import Excel, UI Quản lý Danh bạ (Task 1.10) và UI Field Code (Task 1.11).

## 3. Đề xuất Hướng đi tiếp theo
- Dựng ngay hạ tầng Docker Compose (Task 1.1) và khung Backend (Task 1.2) với Database (Task 1.5). 
- Viết API `/auth/login` (Task 1.6) để mock ra JWT hợp lệ cho Frontend có thể bắt đầu quá trình kiểm thử luồng đăng nhập.
