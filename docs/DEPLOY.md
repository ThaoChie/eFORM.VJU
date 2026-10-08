# Hướng dẫn Deploy Bản Demo E-DRL (Vercel + Render + Neon + Cloudflare R2)

Đây là tài liệu hướng dẫn triển khai bản demo của dự án E-DRL lên các dịch vụ miễn phí.

## Các bước chuẩn bị và triển khai:

1. **Neon:** Tạo project và database; lấy chuỗi kết nối **direct** (không có `-pooler`). Lưu ý: Chuyển chuỗi từ dạng `postgresql://...` sang `jdbc:postgresql://<host>/<db>?sslmode=require` khi nhập vào cấu hình.
2. **Cloudflare R2:** Tạo 3 bucket (`proofs`, `signatures`, `signed-pdfs`), tạo API token quyền đọc và ghi cho 3 bucket. Lấy Account ID, access key, secret key. Cấu hình CORS cho bucket:
   ```json
   [
     {
       "AllowedOrigins": ["https://<domain-vercel>"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
3. **Sinh bí mật:** Chạy `scripts/gen-dev-keystore.sh` để sinh chứng chỉ PKCS#12 tự ký (lưu ý: chứng thư tự ký chỉ dùng cho demo). Tạo thêm các biến: `JWT_SECRET`, `INTERNAL_API_KEY`, `DEMO_SEED_PASSWORD`.
4. **Render, dịch vụ Python:** Kết nối kho mã nguồn trên Render, chọn Blueprint deploy. Nhập biến `INTERNAL_API_KEY`. Kiểm tra dịch vụ đã lên bằng cách gọi `GET /health`. Ghi lại URL Python.
5. **Render, dịch vụ backend:** Trong quá trình Blueprint chạy, nhập toàn bộ biến môi trường ở Phase 4.2 của file `deploy.md` (chuỗi kết nối DB phải lấy chuỗi JDBC). Tạm đặt `CORS_ALLOWED_ORIGINS` và `PUBLIC_BASE_URL` là `http://localhost:5173`. Kiểm tra bằng cách gọi `GET /actuator/health`. Ghi lại URL backend.
6. **Vercel:** Tạo project Vercel từ kho mã nguồn, Root Directory = `frontend-react`, Framework Preset = Vite. Thêm biến môi trường `VITE_API_BASE_URL` trỏ tới `https://<drl-backend>.onrender.com/api/v1`. Triển khai và ghi lại URL frontend.
7. **Quay lại Render backend:** Cập nhật `CORS_ALLOWED_ORIGINS` và `PUBLIC_BASE_URL` thành URL Vercel; để dịch vụ backend triển khai lại với cấu hình mới.
8. **Chạy kiểm tra nhanh:** Chạy `scripts/smoke-test.sh <FRONTEND_URL> <BACKEND_URL> <PYTHON_URL> <INTERNAL_API_KEY> <DEMO_ADMIN_EMAIL> <DEMO_SEED_PASSWORD>` và kiểm tra theo các checklist thủ công.

## Checklist nghiệm thu thủ công
[ ] Mở URL Vercel: thấy banner "đang khởi động" khi máy chủ đang ngủ, tự ẩn khi sẵn sàng
[ ] Đăng nhập được bằng cả 6 tài khoản mẫu; mỗi vai trò thấy đúng menu
[ ] Sinh viên mở phiếu, nhập điểm, tải minh chứng (file xuất hiện ở R2), ký và nộp
[ ] Lớp trưởng hoặc Lớp phó duyệt được, có nhận xét đánh giá; phiếu của Lớp trưởng do Lớp phó duyệt
[ ] Trưởng Khoa duyệt lô: PDF có 3 chữ ký, lưu ở bucket signed-pdfs; hash SHA-256 khớp khi tính lại
[ ] Sau 20 phút không dùng: lần mở tiếp theo vẫn vào được (ghi lại thời gian chờ thực tế)
[ ] Trang xác thực công khai hoạt động, đối chiếu PDF đúng/sai
[ ] Không có bí mật nào trong lịch sử git
[ ] `docker compose up --build` cục bộ vẫn chạy như trước

## Xử lý sự cố
- Ngủ và khởi động chậm: Dịch vụ miễn phí tự ngủ sau 15 phút, lần mở đầu tiên có thể mất 1-2 phút.
- Neon đánh thức: Connection timeout đã được đặt dài để chờ. Dùng connection string direct.
- Lỗi CORS: Kiểm tra lại việc cập nhật `CORS_ALLOWED_ORIGINS` trên Render backend, đảm bảo không có `/` ở cuối.
- Lỗi 401 từ Python: Đảm bảo `INTERNAL_API_KEY` khớp giữa frontend, backend và python.
- Hết RAM ở Python: Xem log ở Render để xem tiến trình có bị OOM không.

## Giới hạn của bản demo
- Dịch vụ ngủ sau 15 phút không truy cập.
- Hạn mức giờ chạy dùng chung trên Render (750h/tháng).
- Không có sao lưu, dữ liệu mẫu chỉ để thử, **không dùng dữ liệu thật của sinh viên**.
- Chứng thư chữ ký là tự ký, sẽ hiển thị warning ở các phần mềm đọc PDF, nhưng vẫn kiểm tra được sự thay đổi của nội dung.
- Gói Vercel Hobby chỉ dành cho mục đích phi thương mại.
