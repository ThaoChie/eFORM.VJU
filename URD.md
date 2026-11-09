# TÀI LIỆU YÊU CẦU NGƯỜI DÙNG (USER REQUIREMENTS DOCUMENT - URD)
## HỆ THỐNG ĐÁNH GIÁ ĐIỂM RÈN LUYỆN SINH VIÊN (E-DRL VJU)

> **Mã tài liệu:** VJU-EDRL-URD-2026  
> **Phiên bản:** 2.1 (Cập nhật chuẩn hóa thực tế theo hiện trạng hệ thống)  
> **Ngày cập nhật:** 29/10/2026  
> **Trạng thái:** Chính thức (Đã lược bỏ nguyên tắc Maker – Checker; Chuẩn hóa hệ thống Button & UI)

---

## 1. GIỚI THIỆU TỔNG QUAN (INTRODUCTION)

### 1.1. Mục đích tài liệu
Tài liệu này xác định toàn bộ **Yêu cầu của Người dùng (User Requirements)** đối với hệ thống **E-Form Đánh giá Điểm Rèn Luyện (E-DRL)** của Trường Đại học Việt Nhật (VJU). Đây là cơ sở thỏa thuận giữa các bên liên quan (Ban Giám hiệu, Phòng Đào tạo & CTSV, Ban chủ nhiệm Khoa, Cán bộ Lớp và Sinh viên) với đội ngũ phát triển kỹ thuật, làm căn cứ nghiệm thu và vận hành phần mềm.

### 1.2. Bối cảnh & Mục tiêu dự án
- **Thực trạng:** Quy trình chấm điểm rèn luyện truyền thống sử dụng phôi Word/giấy thủ công, đối soát minh chứng qua Zalo/Drive phân tán, dễ thất lạc, mất nhiều tuần để tổng hợp và tiềm ẩn nguy cơ sai lệch điểm hoặc làm giả chữ ký.
- **Mục tiêu hệ thống E-DRL:**
  1. **Số hóa 100% quy trình:** Sinh viên tự chấm, đính kèm minh chứng và ký tay điện tử trực tiếp trên web.
  2. **Duyệt 3 cấp tuần tự & Minh bạch:** Cấp Sinh viên $\rightarrow$ Cấp Lớp (Cán bộ lớp thẩm định) $\rightarrow$ Cấp Khoa (Trưởng khoa duyệt lô).
  3. **Đóng gói văn bản pháp lý tự động:** Render PDF từ phôi chuẩn Word, chèn 3 chữ ký, áp dụng cơ chế khóa chống chỉnh sửa **DocMDP (P=1)** và sinh mã băm **SHA-256** bảo chứng toàn vẹn.
  4. **Tra cứu & Chứng thực công khai:** Cho phép quét QR code hoặc đối soát mã băm SHA-256 tức thời mà không cần đăng nhập.

### 1.3. Phạm vi hệ thống (System Scope)
- **Trong phạm vi (In-Scope):**
  - Quản lý cơ cấu tổ chức: Khoa, Phòng ban, Lớp học, Khóa sinh viên, Tài khoản người dùng (hỗ trợ Import/Export Excel).
  - Quản trị biểu mẫu linh hoạt: Kho trường thông tin (Field Master), Trình thiết kế biểu mẫu trực quan (Form Designer) và Quản lý phiên bản biểu mẫu (Form Versioning).
  - Quản lý kỳ chấm ĐRL: Mở kỳ, phân bổ biểu mẫu, gia hạn, đóng kỳ sớm.
  - Cổng Sinh viên: Soạn thảo, đính kèm minh chứng đa định dạng, xem trước PDF Split-screen, ký nộp và tra cứu lịch sử.
  - Cổng Cán bộ lớp: Dashboard thống kê lớp, thẩm định đối soát 2 cột (Split-screen), chấm lại điểm, trả phiếu hoặc ký duyệt cấp Lớp.
  - Cổng Trưởng khoa: Quản lý chữ ký số mẫu, duyệt theo lô (Batch Approval), trả phiếu, pipeline đóng dấu khóa PDF và xuất báo cáo khoa.
  - Cổng Quản trị viên: Phê duyệt trực tiếp hàng đợi yêu cầu (phiên bản biểu mẫu, trường thông tin, phiếu ĐRL), báo cáo tổng hợp toàn trường xuất Excel.
  - Cổng Công khai: Quét mã QR kiểm tra tính hợp lệ và tải PDF để so khớp mã băm SHA-256.
- **Ngoài phạm vi (Out-of-Scope):**
  - Tích hợp cổng thanh toán trực tuyến.
  - Chấm điểm tự động bằng AI (hệ thống chỉ hỗ trợ gợi ý xếp loại theo quy chế điểm).

### 1.4. Thuật ngữ & Viết tắt
| Thuật ngữ | Diễn giải |
| :--- | :--- |
| **ĐRL** | Điểm Rèn Luyện sinh viên theo từng học kỳ. |
| **E-DRL** | Hệ thống phần mềm quản lý và đánh giá ĐRL trực tuyến. |
| **DocMDP** | Modification Detection and Prevention – Tiêu chuẩn bảo vệ và khóa PDF chống chỉnh sửa trái phép sau khi ký chứng nhận. |
| **SHA-256** | Secure Hash Algorithm – Thuật toán băm một chiều tạo chuỗi 64 ký tự định danh toàn vẹn file PDF. |
| **RBAC** | Role-Based Access Control – Phân quyền truy cập dựa trên vai trò kết hợp phạm vi dữ liệu (`deptId`, `classId`). |
| **Split-screen** | Giao diện hiển thị song song 2 cột (cột nhập liệu / đối soát điểm và cột xem minh chứng / PDF). |
| **MinIO** | Hệ thống lưu trữ đối tượng (Object Storage tương thích S3) lưu trữ minh chứng, chữ ký và file PDF hoàn thiện. |

---

## 2. HỒ SƠ TÁC NHÂN (USER PERSONAS & ROLES)

| Vai trò (Role) | Đối tượng thực tế | Trách nhiệm chính trong hệ thống | Phạm vi dữ liệu (Scope) |
| :--- | :--- | :--- | :--- |
| **`STUDENT`** | Sinh viên chính quy | Tự kê khai điểm, tải minh chứng, ký tay số hóa, nộp phiếu, theo dõi tiến độ và tải PDF kết quả. | Chỉ xem và thao tác trên phiếu của chính mình (`studentId = sub`). |
| **`CLASS_LEADER` / `CLASS_DEPUTY`** | Lớp trưởng / Lớp phó | Theo dõi tiến độ lớp, thẩm định minh chứng, chấm lại điểm theo kết quả họp lớp, trả phiếu hoặc ký duyệt cấp Lớp. | Giới hạn trong danh sách sinh viên thuộc Lớp mình phụ trách (`classId`). |
| **`DEAN`** | Trưởng khoa / Ban chủ nhiệm Khoa | Quản lý mẫu chữ ký, xét duyệt theo lô (Batch Approval), ký chốt cấp Khoa, kích hoạt khóa PDF và xuất báo cáo khoa. | Giới hạn trong danh sách lớp/sinh viên thuộc Khoa mình phụ trách (`deptId`). |
| **`ADMIN`** | Phòng Đào tạo & CTSV | Quản lý danh bạ, người dùng, kỳ chấm, trường thông tin, thiết kế biểu mẫu, duyệt yêu cầu hệ thống và báo cáo toàn trường. | Toàn hệ thống (Toàn trường). |
| **`PUBLIC`** | Nhà tuyển dụng, Doanh nghiệp, Bên thứ ba | Quét mã QR hoặc tải file PDF để kiểm tra tính hợp lệ và đối soát mã băm SHA-256 chống làm giả. | Chỉ xem thông tin chứng thực tối thiểu (không lộ điểm chi tiết nhạy cảm). |

---

## 3. YÊU CẦU NGƯỜI DÙNG CHI TIẾT (USER FUNCTIONAL REQUIREMENTS)

### 3.1. Phân hệ Xác thực & Quản lý Tài khoản (UR-AUTH)
- **UR-AUTH-01 (Đăng nhập hệ thống):**
  - *Mô tả:* Là người dùng hệ thống, tôi muốn đăng nhập bằng Email và Mật khẩu để truy cập vào các tính năng tương ứng với vai trò của mình.
  - *Tiêu chí chấp nhận (AC):*
    - Trả về mã JWT hợp lệ chứa thông tin `userId`, `role`, `deptId`, `classId`.
    - Điều hướng tự động về đúng trang chủ tương ứng với vai trò (Sinh viên $\rightarrow$ `/student`, Lớp trưởng $\rightarrow$ `/class-leader`, Khoa $\rightarrow$ `/dean`, Admin $\rightarrow$ `/admin`).
    - Lưu phiên đăng nhập an toàn, xử lý tự động khi token hết hạn (401).
- **UR-AUTH-02 (Đổi mật khẩu):**
  - *Mô tả:* Là người dùng, tôi muốn đổi mật khẩu cá nhân để bảo mật tài khoản.
  - *Tiêu chí chấp nhận (AC):* Yêu cầu nhập đúng mật khẩu cũ; mật khẩu mới tối thiểu 6 ký tự và xác nhận khớp.
- **UR-AUTH-03 (Quản lý chữ ký cá nhân):**
  - *Mô tả:* Là Sinh viên / Cán bộ lớp / Trưởng khoa, tôi muốn tạo mẫu chữ ký của mình (vẽ tay trên Canvas hoặc tải ảnh PNG) để hệ thống tự động gắn vào phiếu khi ký duyệt.
  - *Tiêu chí chấp nhận (AC):*
    - Vẽ mượt mà trên màn hình cảm ứng / chuột.
    - Hỗ trợ tải file ảnh chữ ký (tự động xử lý nền trong suốt).
    - Lưu mẫu chữ ký an toàn trên MinIO.
- **UR-AUTH-04 (Hệ thống thông báo công việc):**
  - *Mô tả:* Là người dùng, tôi muốn nhận thông báo khi có sự kiện liên quan đến phiếu ĐRL (nộp phiếu, trả phiếu, duyệt phiếu, mở kỳ mới).
  - *Tiêu chí chấp nhận (AC):* Có chuông thông báo hiển thị số lượng chưa đọc, popup danh sách thông báo và nút "Đánh dấu đã đọc".

---

### 3.2. Cổng Dịch vụ Sinh viên (UR-STU)
- **UR-STU-01 (Dashboard tổng quan sinh viên):**
  - *Mô tả:* Là sinh viên, tôi muốn theo dõi ngay tình trạng phiếu của học kỳ hiện tại, hạn nộp và điểm rèn luyện gần nhất.
- **UR-STU-02 (Tự chấm điểm rèn luyện):**
  - *Mô tả:* Là sinh viên, tôi muốn nạp biểu mẫu rèn luyện của kỳ hiện tại và tự chấm điểm cho từng tiêu chí đánh giá.
  - *Tiêu chí chấp nhận (AC):*
    - Hệ thống tự động nạp cấu trúc tiêu chí theo phiên bản biểu mẫu đang hiệu lực (`ACTIVE`).
    - Khống chế điểm nhập từng tiêu chí: $0 \le \text{điểm} \le \text{maxScore}$.
    - Khống chế trần điểm của từng nhóm tiêu chí và tổng điểm toàn phiếu $\le 100đ$.
    - Tự động gợi ý xếp loại rèn luyện tương ứng (Xuất sắc, Tốt, Khá, Trung bình, Yếu, Kém).
- **UR-STU-03 (Đính kèm minh chứng đa định dạng):**
  - *Mô tả:* Là sinh viên, tôi muốn đính kèm tài liệu minh chứng cho các tiêu chí yêu cầu minh chứng để chứng minh tính xác thực.
  - *Tiêu chí chấp nhận (AC):*
    - Hỗ trợ tải lên ảnh (JPG, PNG), tài liệu PDF, bảng tính Excel (.xlsx).
    - Hỗ trợ xem trước (preview) ảnh lớn, tài liệu PDF hoặc bảng tính trực tiếp trong modal.
    - Cho phép xóa file minh chứng đã đính kèm khi phiếu ở trạng thái `DRAFT` hoặc `REJECTED`.
    - Giới hạn dung lượng tối đa 10MB/file.
- **UR-STU-04 (Xem trước PDF song song - Split Screen):**
  - *Mô tả:* Là sinh viên, tôi muốn xem trước bản mô phỏng PDF của phiếu ĐRL song song với màn hình nhập liệu để rà soát trực quan trước khi nộp.
- **UR-STU-05 (Lưu nháp phiếu):**
  - *Mô tả:* Là sinh viên, tôi muốn lưu tạm thời dữ liệu đã chấm mà chưa cần nộp ngay để có thể quay lại hoàn thiện sau.
  - *Tiêu chí chấp nhận (AC):* Phiếu được lưu ở trạng thái `DRAFT`, không ràng buộc phải điền đủ 100% minh chứng khi chỉ lưu nháp.
- **UR-STU-06 (Ký & Nộp phiếu chính thức - Đẩy duyệt):**
  - *Mô tả:* Là sinh viên, tôi muốn ký tay xác nhận và nộp phiếu lên Cán bộ lớp xem xét.
  - *Tiêu chí chấp nhận (AC):*
    - Kiểm tra bắt buộc: Mọi tiêu chí có cờ `requires_proof = true` bắt buộc phải có ít nhất 1 file minh chứng.
    - Bắt buộc phải có chữ ký của sinh viên.
    - Trạng thái phiếu chuyển từ `DRAFT` / `REJECTED` $\rightarrow$ `SUBMITTED`.
    - Tự động gửi thông báo đến Lớp trưởng của lớp.
- **UR-STU-07 (Theo dõi danh sách chờ xử lý & Sửa phiếu bị trả):**
  - *Mô tả:* Là sinh viên, tôi muốn biết phiếu của mình đang ở bước nào (Chờ lớp duyệt, Chờ khoa duyệt) và nếu bị trả lại (`REJECTED`), tôi có thể đọc lý do trả và bấm "Tiếp tục soạn thảo" để chỉnh sửa nộp lại.
- **UR-STU-08 (Tra cứu lịch sử & Tải văn bản kết quả):**
  - *Mô tả:* Là sinh viên, tôi muốn xem lại kết quả rèn luyện qua các kỳ và tải file PDF chính thức đã có đầy đủ chữ ký 3 cấp và mã băm SHA-256.

---

### 3.3. Cổng Thẩm định Cấp Lớp (UR-CLS)
- **UR-CLS-01 (Tổng quan rèn luyện lớp):**
  - *Mô tả:* Là Cán bộ lớp, tôi muốn xem bảng điều khiển thể hiện sĩ số lớp, số lượng đã nộp, chưa nộp và phân loại điểm để theo dõi tiến độ.
- **UR-CLS-02 (Hàng đợi thẩm định cấp lớp):**
  - *Mô tả:* Là Cán bộ lớp, tôi muốn xem danh sách toàn bộ phiếu của sinh viên trong lớp đang ở trạng thái `SUBMITTED` để tiến hành thẩm định.
- **UR-CLS-03 (Màn hình đối soát 2 cột Split-screen & Chấm lại điểm):**
  - *Mô tả:* Là Cán bộ lớp, tôi muốn sử dụng giao diện 2 cột chuyên dụng để vừa đối soát minh chứng vừa nhập điểm chấm lại của lớp.
  - *Tiêu chí chấp nhận (AC):*
    - Cột trái: Bảng điểm song song (Cột điểm SV tự chấm và Cột điểm Lớp chấm).
    - Tự động đánh dấu highlight (màu cam nhạt/chấm tròn) các tiêu chí mà Cán bộ lớp đã điều chỉnh điểm khác với sinh viên.
    - Cột phải: Tab chuyển đổi giữa Danh sách minh chứng sinh viên nộp và Bản xem trước PDF.
    - Thanh tổng kết cố định ở chân trang: Tính lại tổng điểm lớp chấm theo thời gian thực và tự động cập nhật xếp loại gợi ý.
- **UR-CLS-04 (Trả lại phiếu kèm lý do bắt buộc):**
  - *Mô tả:* Là Cán bộ lớp, tôi muốn trả lại phiếu không hợp lệ về cho sinh viên kèm giải thích rõ lý do cần bổ sung.
  - *Tiêu chí chấp nhận (AC):*
    - Bắt buộc phải nhập văn bản lý do trả lại.
    - Phiếu chuyển trạng thái từ `SUBMITTED` $\rightarrow$ `REJECTED`.
    - Hệ thống tự động thu hồi chữ ký cũ (`is_revoked = true`) và gửi thông báo tới sinh viên.
- **UR-CLS-05 (Ký & Phê duyệt cấp Lớp):**
  - *Mô tả:* Là Cán bộ lớp, tôi muốn ký xác nhận biên bản họp xét ĐRL của lớp và chuyển phiếu lên cấp Khoa.
  - *Tiêu chí chấp nhận (AC):*
    - Bắt buộc áp dụng chữ ký của Cán bộ lớp.
    - Cập nhật điểm chính thức của lớp vào `score_form_details`.
    - Phiếu chuyển trạng thái từ `SUBMITTED` $\rightarrow$ `CLASS_APPROVED`.

---

### 3.4. Cổng Phê duyệt Cấp Khoa (UR-FAC)
- **UR-FAC-01 (Dashboard theo dõi cấp Khoa):**
  - *Mô tả:* Là Trưởng khoa, tôi muốn theo dõi tiến độ nộp và thẩm định của từng lớp trực thuộc khoa.
- **UR-FAC-02 (Quản lý danh sách lô duyệt - Batch List):**
  - *Mô tả:* Là Trưởng khoa, tôi muốn quản lý các phiếu ĐRL theo từng lô tương ứng với từng lớp học đã hoàn tất duyệt cấp lớp (`CLASS_APPROVED`).
- **UR-FAC-03 (Phê duyệt đồng loạt theo lô - Batch Approval):**
  - *Mô tả:* Là Trưởng khoa, tôi muốn xem danh sách phiếu của lớp và áp dụng chữ ký số phê duyệt đồng loạt cả lô sinh viên trong một lần xác nhận.
  - *Tiêu chí chấp nhận (AC):* Hỗ trợ chọn tất cả hoặc chọn lọc các phiếu; hiển thị thanh tiến trình duyệt lô (`BatchSignProgress`).
- **UR-FAC-04 (Pipeline tự động hóa đóng dấu & Khóa toàn vẹn PDF):**
  - *Mô tả:* Khi Trưởng khoa duyệt phiếu, hệ thống phải tự động thực hiện chuỗi pipeline ngầm để tạo ra file PDF hoàn thiện:
    1. *Bước 1 (Render):* Nạp dữ liệu gọi dịch vụ Python FastAPI để điền dữ liệu vào phôi chuẩn Word (.docx) và xuất ra PDF gốc.
    2. *Bước 2 (Chèn ảnh chữ ký):* Dùng Apache PDFBox chèn 3 ảnh chữ ký (Sinh viên, Cán bộ lớp, Trưởng khoa) vào đúng tọa độ quy định trên form.
    3. *Bước 3 (Khóa DocMDP):* Ký số bằng chứng thư số của hệ thống (PKCS#12 Keystore) và thiết lập quyền `DocMDP P=1` (khóa toàn diện, ngăn chặn mọi sửa đổi).
    4. *Bước 4 (Băm SHA-256):* Tính toán mã băm SHA-256 trên chính file PDF đã hoàn thiện.
    5. *Bước 5 (Lưu trữ):* Đẩy file PDF lên MinIO bucket `signed-pdfs`, lưu mã hash vào CSDL và đặt `is_locked = true`, trạng thái chuyển sang `DEAN_APPROVED`.
- **UR-FAC-05 (Trả lại phiếu cấp Khoa):**
  - *Mô tả:* Là Trưởng khoa, tôi muốn trả lại phiếu chưa đạt về trực tiếp cho sinh viên kèm lý do bắt buộc (`CLASS_APPROVED` $\rightarrow$ `REJECTED`).
- **UR-FAC-06 (Báo cáo & Xuất Excel cấp Khoa):**
  - *Mô tả:* Là Trưởng khoa, tôi muốn xem báo cáo tổng hợp kết quả ĐRL của toàn khoa, xem nhanh file PDF đã ký và xuất file Excel thống kê theo chuẩn biểu mẫu nhà trường.

---

### 3.5. Cổng Quản trị Hệ thống & Cấu hình (UR-ADM)
*(Lưu ý: Hệ thống đã loại bỏ hoàn toàn cơ chế Maker – Checker; Quản trị viên có toàn quyền thao tác, chỉnh sửa và phê duyệt trực tiếp).*

- **UR-ADM-01 (Quản lý Danh bạ Đơn vị - Khoa, Phòng ban, Lớp học):**
  - *Mô tả:* Là Quản trị viên, tôi muốn quản lý cấu trúc tổ chức trường học:
    - Khoa & Phòng ban: Thêm mới, sửa tên/mã, bật/tắt trạng thái hoạt động, gán Trưởng đơn vị.
    - Lớp học: Thêm mới, sửa, gán Khoa trực thuộc, khóa sinh viên, chỉ định Lớp trưởng và Lớp phó.
- **UR-ADM-02 (Quản lý Người dùng & Import Excel hàng loạt):**
  - *Mô tả:* Là Quản trị viên, tôi muốn quản lý tài khoản người dùng và nhập liệu danh sách sinh viên/giảng viên từ file Excel.
  - *Tiêu chí chấp nhận (AC):*
    - CRUD tài khoản, phân quyền Role (`ADMIN`, `DEAN`, `CLASS_LEADER`, `CLASS_DEPUTY`, `STUDENT`).
    - Cung cấp file Excel mẫu chuẩn (`Mau_nhap_nguoi_dung_Chuan.xlsx`).
    - Tính năng **Import Excel**: Kiểm tra tính hợp lệ từng dòng (trùng email, sai format, mã lớp không tồn tại), trả về danh sách dòng lỗi chi tiết và chỉ import các dòng hợp lệ.
    - Xuất dữ liệu người dùng ra Excel theo bộ lọc.
- **UR-ADM-03 (Quản lý Kỳ chấm ĐRL):**
  - *Mô tả:* Là Quản trị viên, tôi muốn mở đợt đánh giá rèn luyện cho toàn trường hoặc từng khoa.
  - *Tiêu chí chấp nhận (AC):*
    - Thiết lập: Tên học kỳ, biểu mẫu áp dụng, phạm vi (Toàn trường / Khoa cụ thể), hạn nộp.
    - Gia hạn: Điều chỉnh hạn nộp muộn hơn cho kỳ đang mở.
    - Đóng kỳ sớm: Dừng nhận bài nộp trước hạn nếu cần thiết.
- **UR-ADM-04 (Quản lý Trường thông tin - Field Master):**
  - *Mô tả:* Là Quản trị viên, tôi muốn tạo kho dữ liệu trường thông tin động để phục vụ thiết kế biểu mẫu.
  - *Tiêu chí chấp nhận (AC):*
    - Cấu hình mã trường (`field_code`), tên trường, kiểu dữ liệu (`STRING`, `NUMBER`, `DATE`, `BOOLEAN`, `FILE`, `SIGNATURE`).
    - Phân nhóm: `COMMON` (thông tin chung), `HEADER` (tiêu đề), `FOOTER` (chân trang/chữ ký).
    - Cấu hình luật kiểm tra: Regex pattern, giá trị min/max, cờ bắt buộc.
    - Bật/tắt hiệu lực trường; xem lịch sử các phiên bản thay đổi của trường thông tin.
- **UR-ADM-05 (Quản lý Phiên bản Biểu mẫu - Form Versions):**
  - *Mô tả:* Là Quản trị viên, tôi muốn quản lý các phiên bản biểu mẫu đánh giá qua các năm học.
  - *Tiêu chí chấp nhận (AC):*
    - Thêm mới phiên bản biểu mẫu (mã, tên, học kỳ, phạm vi áp dụng).
    - Sao chép cấu hình từ phiên bản biểu mẫu khác để tiết kiệm thời gian khởi tạo.
    - Cơ chế **Clone phiên bản an toàn**: Khi chỉnh sửa một biểu mẫu đang ở trạng thái `ACTIVE` (đang có sinh viên sử dụng), hệ thống không ghi đè trực tiếp mà tự động tạo một phiên bản clone mới (`v1.1`, `v2.0`) ở trạng thái `DRAFT`.
    - Kích hoạt biểu mẫu (`ACTIVE`) hoặc vô hiệu hóa (`INACTIVE`).
- **UR-ADM-06 (Trình thiết kế Biểu mẫu trực quan - Form Designer):**
  - *Mô tả:* Là Quản trị viên, tôi muốn dùng giao diện kéo thả/cấu hình cây phân cấp để thiết kế form đánh giá mà không cần can thiệp code backend.
  - *Tiêu chí chấp nhận (AC):*
    - Cấu trúc nhóm tiêu chí cha - tiêu chí con.
    - Cài đặt điểm tối đa từng tiêu chí và điểm trần của nhóm.
    - Gán các Field Code đã định nghĩa vào form.
    - Định vị tọa độ 3 ô chữ ký trên trang tài liệu.
- **UR-ADM-07 (Xử lý Hàng đợi Phê duyệt Admin - Pending Queue):**
  - *Mô tả:* Là Quản trị viên, tôi muốn xem tập trung mọi yêu cầu đang chờ xử lý trên hệ thống (Phiên bản biểu mẫu mới, Trường thông tin mới, Phiếu điểm chờ duyệt cấp trường).
  - *Tiêu chí chấp nhận (AC):*
    - Hiển thị danh sách tổng hợp yêu cầu, phân loại rõ đối tượng.
    - **Phê duyệt hoặc Từ chối trực tiếp:** Quản trị viên có toàn quyền bấm duyệt hoặc từ chối kèm lý do ngay trong modal chi tiết (đã loại bỏ rào cản Maker - Checker).

---

### 3.6. Phân hệ Báo cáo & Thống kê Toàn trường (UR-REP)
- **UR-REP-01 (Tra cứu & Lọc dữ liệu đa chiều):**
  - *Mô tả:* Là Quản trị viên, tôi muốn tra cứu kết quả rèn luyện toàn trường theo bộ lọc động: Học kỳ, Khoa, Lớp, Niên khóa và Từ khóa (Họ tên, Mã SV).
- **UR-REP-02 (Xem trực tuyến PDF đã ký số):**
  - *Mô tả:* Là Quản trị viên / Trưởng khoa, tôi muốn mở xem trực tiếp bản PDF đã hoàn tất quy trình ký số 3 cấp lưu trên MinIO thông qua trình xem PDF tích hợp sẵn.
- **UR-REP-03 (Xuất Báo cáo Excel chuẩn Đào tạo):**
  - *Mô tả:* Là Quản trị viên, tôi muốn xuất dữ liệu tổng hợp kết quả ĐRL ra file Excel (.xlsx) theo định dạng chuẩn của Phòng Đào tạo (chứa đầy đủ thông tin sinh viên, điểm Lớp, điểm Khoa, xếp loại và liên kết tải PDF) để phục vụ xét học bổng, khen thưởng và tốt nghiệp.

---

### 3.7. Phân hệ Xác thực Toàn vẹn Công khai (UR-PUB)
- **UR-PUB-01 (Tra cứu thông tin qua mã QR / URL):**
  - *Mô tả:* Là bên thứ ba (nhà tuyển dụng, tổ chức cấp học bổng), tôi muốn quét mã QR in trên phiếu ĐRL hoặc truy cập đường dẫn công khai `/verify/:id` (không cần tài khoản) để kiểm tra tính chính thống của văn bản.
  - *Tiêu chí chấp nhận (AC):*
    - Hiển thị thông tin chứng thực tối thiểu: Họ tên sinh viên, Lớp, Học kỳ, Trạng thái chứng nhận, Thời điểm duyệt và Mã băm SHA-256 gốc đã lưu trong CSDL.
    - Đảm bảo quyền riêng tư: Không hiển thị bảng điểm chi tiết hay thông tin liên lạc cá nhân.
- **UR-PUB-02 (Kiểm tra toàn vẹn file PDF - Chống làm giả):**
  - *Mô tả:* Là người tiếp nhận văn bản, tôi muốn tải một file PDF bất kỳ lên hệ thống để đối soát xem văn bản đó có bị chỉnh sửa nội dung/điểm số hay không.
  - *Tiêu chí chấp nhận (AC):*
    - Hệ thống tính toán mã băm SHA-256 của file tải lên và so khớp với mã băm gốc lưu trong CSDL.
    - Nếu khớp 100%: Thông báo *"Văn bản nguyên bản, chữ ký số hợp lệ"*.
    - Nếu lệch mã băm: Cảnh báo *"Văn bản đã bị can thiệp chỉnh sửa hoặc không tồn tại trên hệ thống"*.

---

## 4. QUY TẮC NGHIỆP VỤ BẮT BUỘC (BUSINESS RULES - BR)

- **BR-01 (Quy tắc tính điểm & Chặn trần):**
  - $0 \le \text{Điểm tiêu chí} \le \text{Điểm tối đa của tiêu chí}$.
  - $\sum \text{Điểm tiêu chí trong nhóm} \le \text{Điểm tối đa của nhóm}$.
  - Tổng điểm toàn bộ phiếu: $\text{Tổng điểm} \le 100đ$.
- **BR-02 (Khung xếp loại rèn luyện):**
  - $\ge 90đ$: Xuất sắc
  - $80 \le \text{Điểm} < 90đ$: Tốt
  - $65 \le \text{Điểm} < 80đ$: Khá
  - $50 \le \text{Điểm} < 65đ$: Trung bình
  - $35 \le \text{Điểm} < 50đ$: Yếu
  - $< 35đ$: Kém
- **BR-03 (Bắt buộc minh chứng):** Bất kỳ tiêu chí nào được cấu hình `requires_proof = true` thì sinh viên bắt buộc phải đính kèm tối thiểu 1 file minh chứng hợp lệ mới được phép bấm "Đẩy duyệt".
- **BR-04 (Quy trình duyệt 3 cấp bất biến):** Phiếu phải đi tuần tự qua:
  $$\text{DRAFT} \xrightarrow{\text{SV ký nộp}} \text{SUBMITTED} \xrightarrow{\text{Lớp thẩm định & ký}} \text{CLASS\_APPROVED} \xrightarrow{\text{Khoa duyệt lô & ký}} \text{DEAN\_APPROVED}$$
- **BR-05 (Thu hồi chữ ký khi trả phiếu):** Khi Cán bộ lớp hoặc Trưởng khoa trả phiếu (`REJECTED`), toàn bộ các chữ ký trước đó sẽ bị đánh dấu thu hồi (`is_revoked = true`). Sinh viên phải ký lại khi nộp lại.
- **BR-06 (Tính bất biến khi đã khóa - Locked State):** Khi phiếu đạt trạng thái `DEAN_APPROVED`, cờ `is_locked = true` được kích hoạt. Mọi API sửa đổi dữ liệu điểm hoặc minh chứng đối với phiếu này đều bị từ chối (`409 Conflict: FORM_LOCKED`).
- **BR-07 (Chuẩn hóa thiết kế Button & UI):** Toàn bộ giao diện phải tuân thủ chuẩn thiết kế đồng nhất theo trang Danh bạ đơn vị:
  - Cột thao tác trên lưới bảng: Dùng `IconButton` gọn gàng (`size-9`, bo góc `rounded-lg`, icon `size-4`, hover hiệu ứng màu, tooltip chú thích rõ ràng).
  - Nút hành động chính (Thêm mới, Đẩy duyệt, Xác nhận, Tìm kiếm): Nền màu đỏ thương hiệu VJU (`#c62828`), chữ trắng, `h-10`.
  - Nút hành động phụ (Quay lại, Hủy): Nền trắng viền xám (`h-10`).

---

## 5. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)

### 5.1. Bảo mật & Xác thực (Security)
- Xác thực Stateless qua JSON Web Token (JWT), lưu an toàn tại Client.
- Mật khẩu người dùng được băm bằng thuật toán **BCrypt** (cost factor 10).
- Phân quyền kép (Role-based kết hợp Data-scope): Cán bộ lớp chỉ được xem/duyệt lớp mình; Trưởng khoa chỉ được xem/duyệt khoa mình. Vi phạm trả về `403 Forbidden Scope`.

### 5.2. Tính toàn vẹn & Giá trị pháp lý (Integrity & Legal Compliance)
- File PDF kết quả được bảo chứng bằng cơ chế **DocMDP (P=1)** sử dụng chứng thư số PKCS#12 của nhà trường.
- Lưu trữ song song mã băm **SHA-256** của file PDF để đối chiếu chống chối bỏ và chống giả mạo văn bản.

### 5.3. Hiệu năng & Khả năng chịu tải (Performance & Scalability)
- Thời gian phản hồi trung bình các truy vấn danh sách, tìm kiếm, lưu nháp: $< 500ms$.
- Thời gian thực hiện pipeline ký số và render PDF cho một lô 50 phiếu: $< 15$ giây (xử lý bất đồng bộ/tuần tự trong transaction riêng).
- Tách biệt kiến trúc: Spring Boot đảm nhiệm Logic nghiệp vụ & Transaction; Python FastAPI microservice chuyên trách render PDF; MinIO chuyên trách lưu trữ object.

### 5.4. Tính khả dụng & Trải nghiệm người dùng (Usability)
- Giao diện tiếng Việt chuẩn hóa văn phong sư phạm đại học.
- 100% các trang có bộ lọc dữ liệu phải có thiết kế thẳng hàng, cân xứng, có nút "Xóa bộ lọc" và "Tìm kiếm" màu đỏ nhận diện thương hiệu.
- Hỗ trợ thao tác tốt trên cả máy tính bàn, laptop và thiết bị bảng cảm ứng (khi vẽ chữ ký tay).

---

## 6. MA TRẬN TRUY XUẤT YÊU CẦU (REQUIREMENTS TRACEABILITY MATRIX)

| Nhóm Yêu cầu | Use Case liên quan | Module Mã nguồn Backend | Giao diện Frontend |
| :--- | :--- | :--- | :--- |
| **Xác thực & Tài khoản** | UC-AUTH-01 $\rightarrow$ 04 | `AuthController`, `UserService` | `LoginPage`, `ChangePasswordPage`, `MySignaturePage` |
| **Cổng Sinh viên** | UC-STU-01 $\rightarrow$ 08 | `SubmissionController`, `WorkflowController` | `StudentDashboard`, `ComposePage`, `PendingListPage`, `HistoryPage` |
| **Cổng Cán bộ Lớp** | UC-CLS-01 $\rightarrow$ 05 | `ReviewController`, `WorkflowService` | `ClassOverviewPage`, `ReviewQueuePage`, `ReviewDetailPage` |
| **Cổng Trưởng khoa** | UC-FAC-01 $\rightarrow$ 06 | `ReviewController`, `PdfEngine`, `ReportService` | `DeanDashboard`, `BatchListPage`, `BatchDetailPage`, `DeanReportPage` |
| **Cổng Quản trị viên** | UC-ADM-01 $\rightarrow$ 07 | `DirectoryController`, `FormVersionController`, `FieldMasterController`, `AdminApprovalController` | `AdminDashboard`, `DirectoryPage`, `FieldCodeListPage`, `FormVersionListPage`, `FormDesignerPage`, `ApprovalQueuePage` |
| **Báo cáo Toàn trường** | UC-REP-01 $\rightarrow$ 03 | `ReportController`, `ReportService` | `SchoolReportPage`, `DeanReportPage` |
| **Xác thực Công khai** | UC-PUB-01 $\rightarrow$ 02 | `PublicVerifyController` | `VerifyPage` (Public Route `/verify/:id`) |

---

## 7. KẾ HOẠCH BÀN GIAO & TIÊU CHUẨN NGHIỆM THU (ACCEPTANCE CRITERIA)

Hệ thống được coi là đạt yêu cầu nghiệm thu người dùng khi thỏa mãn:
1. Luồng chạy xuyên suốt từ Sinh viên tự chấm $\rightarrow$ Cán bộ lớp thẩm định $\rightarrow$ Trưởng khoa duyệt lô không bị gián đoạn hay lỗi dữ liệu.
2. File PDF xuất ra có đủ 3 chữ ký nằm đúng khung ô, hiển thị mã băm SHA-256 và mở bằng Adobe Acrobat Reader báo chữ ký chứng nhận hợp lệ (DocMDP).
3. Đã gỡ bỏ hoàn toàn rào cản Maker - Checker trên giao diện Admin; Quản trị viên duyệt trực tiếp yêu cầu thành công.
4. Hệ thống nút bấm đồng nhất chuẩn đỏ thương hiệu VJU trên 100% các phân hệ.
