# TASK.MD: KẾ HOẠCH PHÁT TRIỂN E-DRL (SPRING BOOT + REACT) — 4 SPRINT

> **Phiên bản:** 2.0 — cập nhật 02/10/2026
> **Đọc kèm:** `context.md` (nghiệp vụ, DB, API, quy ước) và `project_structure.md` (cây thư mục).
> **Cách dùng:** Đánh dấu `[x]` khi hoàn thành. Mỗi task có **Kết quả kiểm tra (AC)** để xác nhận xong thật sự. Khi nhờ AI code, luôn kèm đường dẫn thư mục theo `context.md` mục 11.4.

---

## Mục lục

1. [Tổng quan kế hoạch](#1-tổng-quan-kế-hoạch)
2. [Definition of Done chung](#2-definition-of-done-chung)
3. [Sprint 1 — Nền tảng, Auth, Danh bạ, Field Code](#sprint-1--nền-tảng-auth-danh-bạ-field-code-module-1-2-4)
4. [Sprint 2 — Form Builder, Soạn thảo, Thông báo](#sprint-2--form-builder-soạn-thảo-thông-báo-module-3-6-7)
5. [Sprint 3 — Workflow duyệt & Engine ký số PDF](#sprint-3--workflow-duyệt--engine-ký-số-pdf-module-5)
6. [Sprint 4 — Báo cáo, Tra cứu công khai, Hardening & Triển khai](#sprint-4--báo-cáo-tra-cứu-công-khai-hardening--triển-khai-module-8)
7. [Ma trận Module ↔ Sprint](#7-ma-trận-module--sprint)
8. [Quản lý rủi ro & phụ thuộc](#8-quản-lý-rủi-ro--phụ-thuộc)

---

## 1. Tổng quan kế hoạch

| Sprint | Mục tiêu | Module | Thời gian đề xuất* | Kết quả demo được |
|---|---|---|---|---|
| **1** | Nền tảng + đăng nhập + danh bạ + Field Code | 1, 2, 4 | 05/10 – 16/10 | Admin đăng nhập, import danh bạ Excel, quản lý Field Code |
| **2** | Form Builder + sinh viên soạn/nộp phiếu + thông báo | 3, 6, 7 | 19/10 – 30/10 | Admin tạo biểu mẫu; SV tự chấm, đính minh chứng, ký, nộp |
| **3** | Luồng duyệt Lớp/Khoa + render & ký số PDF | 5 | 02/11 – 13/11 | Một phiếu đi hết 3 cấp ra PDF có 3 chữ ký, hash, khóa DocMDP |
| **4** | Báo cáo, verify công khai, hardening, Docker, kiểm thử | 8 | 16/11 – 27/11 | Hệ thống chạy `docker compose up`, xuất Excel, tra cứu hash |

\* Mốc thời gian là **đề xuất** (2 tuần/sprint), điều chỉnh theo nguồn lực nhóm.

### Nguyên tắc ưu tiên

- **Đường găng (critical path):** Auth → Form version → Soạn phiếu → Workflow → PDF engine. Việc nào chặn đường găng làm trước.
- **Rủi ro cao nhất là PDF engine (Python + PDFBox + DocMDP + keystore).** Spike kỹ thuật bắt đầu **từ Sprint 2** (Task 2.9) để Sprint 3 không bị trễ.
- Backend và Frontend của cùng module phát triển song song sau khi chốt hợp đồng API (mục 10 `context.md`); dùng Swagger UI làm hợp đồng.

---

## 2. Definition of Done chung

Một task chỉ được tick `[x]` khi đạt **tất cả**:

```text
[ ] Code đặt đúng thư mục theo quy ước (context.md mục 11.4)
[ ] Controller trả ApiResponse<T>; không trả Entity
[ ] Endpoint có @PreAuthorize đúng role + kiểm tra phạm vi dữ liệu (lớp/khoa/chủ phiếu)
[ ] Có validate DTO (@Valid) và mã lỗi chuẩn (context.md mục 11.3)
[ ] Phân trang: FE 1-based, BE 0-based, chuyển đổi chỉ ở services/ của FE
[ ] Có test tương ứng (unit/integration) và test pass
[ ] Hiển thị chuỗi qua common/messages.js (FE), không hard-code
[ ] Không lộ secret/URL thật trong repo; biến mới đã thêm vào .env.example
[ ] Swagger UI phản ánh đúng endpoint (BE)
[ ] Đã demo được theo AC của task
```

---

# SPRINT 1 — Nền tảng, Auth, Danh bạ, Field Code (Module 1, 2, 4)

**Mục tiêu:** có khung monorepo chạy được, đăng nhập JWT 4 role, quản lý danh bạ (Excel), quản lý Field Code.

## Hạ tầng & Scaffolding

### Task 1.1: Docker Compose môi trường phát triển
- [ ] `docker-compose.yml` gồm: PostgreSQL 16 (5432), MinIO (API 9000, Console 9001).
- [ ] Job khởi tạo tự tạo 3 bucket: `proofs`, `signatures`, `signed-pdfs`.
- [ ] Volume cho `postgres` và `minio` (dữ liệu không mất khi restart).
- [ ] Healthcheck cho `postgres`, `minio`.
- [ ] `.env.example` liệt kê đủ biến (xem `context.md` mục 13); `.env` nằm trong `.gitignore`.
- **AC:** `docker compose up -d` → truy cập MinIO Console thấy đủ 3 bucket; restart container không mất dữ liệu.

### Task 1.2: Khởi tạo Backend Spring Boot
- [ ] Project Maven/Gradle: Spring Boot 3, Java 17; dependency: Web, Data JPA, Security, Validation, PostgreSQL driver, Flyway, jjwt, PDFBox, POI, MinIO SDK, springdoc-openapi, Lombok, (MapStruct tùy chọn).
- [ ] Tạo cấu trúc package: `Wrapper/`, `controller/`, `dao/`, `hibernateDao/`, `dto/request/`, `dto/response/`, `enu/`, `model/`, `security/`, `service/`, `service/engine/`.
- [ ] `Wrapper/ApiResponse<T>` và `Wrapper/PageWrapper<T>`.
- [ ] `@RestControllerAdvice` xử lý lỗi → mã lỗi chuẩn (400/401/403/404/409/422/500).
- [ ] Cấu hình CORS theo `CORS_ALLOWED_ORIGINS`; `application.yml` đọc biến môi trường.
- [ ] Cấu hình bean MinIO client + service tiện ích upload/download/presign (`service/StorageService`).
- **AC:** App khởi động, Swagger UI mở được; gọi endpoint không tồn tại trả JSON `ApiResponse` lỗi (không phải trang lỗi mặc định).

### Task 1.3: Khởi tạo Frontend React + Vite
- [ ] Vite React; cài Ant Design v5, Zustand, React Hook Form, react-signature-canvas, Axios, React Router.
- [ ] Cấu trúc: `common/`, `components/`, `lib/axios/`, `pages/`, `services/`, `stores/`.
- [ ] `lib/axios/client.js`: gắn Bearer JWT; interceptor `401` → logout + về trang login, `403` → thông báo không đủ quyền.
- [ ] `lib/axios/api-paths.js` tập trung URL; `common/messages.js`, `common/constants.js`, `common/permission-config.js`.
- **AC:** `npm run dev` chạy; gọi thử `/api/v1/auth/me` khi chưa đăng nhập → tự về trang login.

### Task 1.4: Tools — khung Python `word-parser`
- [ ] `tools/word-parser/main.py` (FastAPI) với `GET /health` và `POST /render` (tạm trả PDF mẫu/tối giản).
- [ ] `requirements.txt`, `Dockerfile`, thư mục `templates/`.
- **AC:** `GET /health` trả 200; chạy được trong container.

## Backend

### Task 1.5: CSDL — Migration & Seed (12 bảng)
- [ ] Viết Flyway migration tạo **12 bảng** theo `context.md` mục 6 (kèm UNIQUE, FK, chỉ mục khuyến nghị).
- [ ] Entity JPA ở `model/`, repository ở `dao/`; enum ở `enu/`.
- [ ] Seeder: Khoa mẫu, Lớp mẫu, Học kỳ mẫu (1 học kỳ `is_active`), tài khoản mẫu cho **cả 4 role** (mật khẩu BCrypt, lấy từ cấu hình dev), trong đó có `admin@drl.edu.vn`.
- **AC:** Migration chạy sạch trên DB rỗng; seed xong đăng nhập được bằng 4 tài khoản mẫu. Seed không chạy ở profile production.

### Task 1.6: Module 1 — Authentication & RBAC
- [ ] `POST /api/v1/auth/login`: xác thực email + mật khẩu → JWT chứa `userId`, `role`, `deptId`, `classId`.
- [ ] `GET /api/v1/auth/me`; `POST /api/v1/auth/change-password`.
- [ ] `security/`: `JwtAuthenticationFilter`, `SecurityConfig` (stateless), `UserDetailsService`, xử lý `AuthenticationEntryPoint`/`AccessDeniedHandler` trả `ApiResponse`.
- [ ] Bật `@EnableMethodSecurity`; helper `CurrentUser` lấy `userId/role/deptId/classId` từ JWT.
- [ ] Tài khoản `is_active = false` không đăng nhập được.
- **AC (test):** đăng nhập đúng → 200 + token; sai mật khẩu → 401; STUDENT gọi endpoint ADMIN → 403; không token → 401.

### Task 1.7: Module 2 — Khoa, Lớp & Danh bạ người dùng
- [ ] CRUD `/departments`, `/classes` (ADMIN ghi; mọi role đọc).
- [ ] `GET /directory/users`: lọc Khoa/Lớp/Khóa/Role, phân trang — **cài bằng `hibernateDao/`** (Criteria API).
- [ ] `POST/PUT/DELETE /directory/users`; upload chữ ký mẫu → bucket `signatures` (kiểm tra MIME PNG/JPEG, ≤ giới hạn kích thước).
- [ ] Xóa user: dùng xóa mềm (`is_active=false`) nếu user đã có phiếu/log.
- [ ] `GET /directory/template-excel`: sinh file mẫu bằng POI.
- [ ] `POST /directory/users/import`: đọc `.xlsx` (POI), validate (trùng `user_code`/`email`, tồn tại Khoa/Lớp, định dạng), trả **danh sách dòng hợp lệ và dòng lỗi (số dòng + lý do)**; hỗ trợ chế độ *preview* (chưa ghi) và *confirm* (ghi batch).
- [ ] `GET /directory/users/export`: xuất theo bộ lọc.
- **AC:** import file 500 dòng (có 10 dòng lỗi) → preview đúng 490 hợp lệ/10 lỗi; confirm ghi đúng 490; import lặp lại → báo trùng, không ghi đè.

### Task 1.8: Module 4 — Field Code Master
- [ ] CRUD `/fields` (lưu `data_type`, `regex_pattern`, `min_value`, `max_value`, `is_required`).
- [ ] Validate: `field_code` snake_case, duy nhất; `regex_pattern` phải biên dịch được; `min ≤ max`.
- [ ] `PATCH /fields/{id}/toggle-status`.
- [ ] Khóa sửa `field_code` nếu đã được tham chiếu bởi `criteria` (trả `409`).
- **AC:** sửa `field_code` đã dùng → 409; regex sai → 400 kèm thông báo.

## Frontend

### Task 1.9: Đăng nhập & App Shell
- [ ] Trang Login (React Hook Form, hiển thị lỗi, lưu token + user vào `useAuthStore`).
- [ ] Layout chính: Header, Sidebar menu động theo role (`permission-config.js`), route guard theo role.
- [ ] Trang "Không đủ quyền" và tự đăng xuất khi token hết hạn.
- **AC:** 4 role đăng nhập thấy 4 menu khác nhau; truy cập URL ngoài quyền bị chặn.

### Task 1.10: UI Danh bạ & Import Excel
- [ ] Bảng người dùng (AntD Table) phân trang, bộ lọc liên hoàn Khoa → Khóa → Lớp.
- [ ] Modal tạo/sửa user, upload & preview chữ ký mẫu.
- [ ] Modal Import: kéo-thả file, tiến trình, xem trước danh sách hợp lệ/lỗi, nút xác nhận lưu.
- [ ] Nút tải file mẫu và xuất Excel.
- **AC:** luồng import 2 bước (preview → confirm) hoạt động; lỗi hiển thị theo từng dòng.

### Task 1.11: UI Field Code
- [ ] Bảng Field Code, chip hiển thị `data_type` (`NUMBER`, `FILE`, `SIGNATURE`...).
- [ ] Modal thêm/sửa với validation động theo `data_type` (NUMBER: min/max; STRING: regex).
- [ ] Nút bật/tắt trạng thái; field đã dùng khóa ô `field_code`.
- **AC:** thêm Field Code NUMBER có min/max; sai định dạng bị chặn ở FE và BE.

### Sprint 1 — Kết thúc
- [ ] Demo: đăng nhập 4 role → Admin import danh bạ → tạo Field Code.
- [ ] Review & ghi nhận nợ kỹ thuật cho Sprint 2.

---

# SPRINT 2 — Form Builder, Soạn thảo, Thông báo (Module 3, 6, 7)

**Mục tiêu:** Admin thiết kế & kích hoạt biểu mẫu có phiên bản; sinh viên tự chấm, đính minh chứng, ký tay, nộp; thông báo hoạt động.

## Backend

### Task 2.1: Học kỳ & Tiêu chí (criteria)
- [ ] CRUD `/semesters` (đảm bảo tối đa 1 học kỳ `is_active`).
- [ ] CRUD `/criteria` theo học kỳ, liên kết `field_master`; `max_score`, `requires_proof`, `order_index`.
- [ ] Validate: tổng `max_score` các tiêu chí của học kỳ phải = 100 khi kích hoạt biểu mẫu (cảnh báo hoặc chặn, theo quy định nghiệp vụ — **chốt với nghiệp vụ**).
- **AC:** không thể bật 2 học kỳ cùng `is_active`; tiêu chí trỏ Field Code đã tắt bị từ chối.

### Task 2.2: Module 3 — Biểu mẫu & Versioning
- [ ] `GET/POST /forms/templates`: lưu `template_layout_json` (JSONB). Validate JSON cấu trúc cơ bản và mọi Field Code trong layout phải tồn tại & đang active.
- [ ] `PUT /forms/templates/{id}`: bản `DRAFT` sửa trực tiếp; bản `ACTIVE` → **tự clone** bản mới (`version_no` tăng, v1.0 → v1.1) ở trạng thái `DRAFT`.
- [ ] `PATCH /forms/templates/{id}/activate`: bản cũ cùng (`form_code`, `semester_id`) → `INACTIVE`; đảm bảo tối đa 1 `ACTIVE`.
- [ ] Phiếu đã gắn `form_version_id` **không bị đổi** khi biểu mẫu có phiên bản mới.
- **AC (test):** sửa bản ACTIVE tạo bản mới, bản cũ nguyên vẹn; kích hoạt bản mới tự chuyển bản cũ INACTIVE.

### Task 2.3: Module 7 — API soạn thảo phiếu
- [ ] `GET /editor/my-form?semesterId=`: nạp phiếu + tiêu chí + layout; tạo `DRAFT` + `score_form_details` nếu chưa có (học kỳ phải `is_active`, có form `ACTIVE`).
- [ ] `POST /editor/save-draft`: lưu điểm tự chấm; validate `0 ≤ điểm ≤ max_score`; cập nhật `student_total`.
- [ ] `POST /editor/upload-proof`: multipart; kiểm tra MIME/kích thước; tên object UUID; lưu bucket `proofs`; trả `proof_url`/object key.
- [ ] `POST /editor/submit-and-sign`: kiểm tra (tổng ≤ 100, tiêu chí `requires_proof` đủ minh chứng, chữ ký base64 là PNG hợp lệ); lưu chữ ký → `signatures`; ghi `signature_logs` (order=1, kèm `ip_address`); chuyển `SUBMITTED`; ghi `audit_logs`.
- [ ] `DELETE /editor/cancel-draft`: chỉ xóa được phiếu `DRAFT` của chính mình (kèm file minh chứng mồ côi nếu có).
- [ ] Cho phép nộp lại từ `REJECTED` (cùng endpoint submit; chữ ký cũ giữ `is_revoked=TRUE`).
- **AC (test):** thiếu minh chứng → 422 `PROOF_REQUIRED`; tổng > 100 → 422 `SCORE_EXCEEDED`; SV khác truy cập phiếu người khác → 403; phiếu `SUBMITTED` không sửa được.

### Task 2.4: Module 6 — Notification Engine
- [ ] `NotificationService` (tạo/đọc); `GET /notifications` (phân trang, đếm chưa đọc), `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all`.
- [ ] Trigger: SV nộp phiếu → thông báo Lớp trưởng của lớp đó; (các trigger trả phiếu/duyệt hoàn tất bổ sung ở Sprint 3).
- [ ] Chỉ chủ thông báo đọc/đánh dấu được thông báo của mình.
- **AC:** nộp phiếu → Lớp trưởng đúng lớp nhận thông báo, Lớp trưởng lớp khác thì không.

### Task 2.5: Audit helper
- [ ] `AuditService.log(scoreFormId, userId, action, from, to, note)` — dùng thống nhất trong mọi chuyển trạng thái (áp dụng từ Task 2.3).
- **AC:** mỗi lần đổi trạng thái có đúng một dòng `audit_logs`.

## Frontend

### Task 2.6: Form Builder (Admin)
- [ ] Giao diện 3 cột: cây Field Code (trái) · canvas thả tiêu chí (giữa) · thuộc tính `max_score`, `requires_proof`, bắt buộc (phải).
- [ ] Xuất/nhập JSON layout; lưu thành phiên bản; hiển thị danh sách phiên bản và trạng thái.
- [ ] Chế độ Preview mô phỏng giao diện sinh viên.
- [ ] Nút Kích hoạt (xác nhận, cảnh báo bản ACTIVE cũ sẽ INACTIVE).
- **AC:** kéo-thả tạo biểu mẫu, lưu, kích hoạt; sửa bản ACTIVE tạo bản mới v1.1.

### Task 2.7: Màn hình soạn phiếu (Sinh viên)
- [ ] `Renderer.jsx` render form động từ JSON layout + tiêu chí từ API.
- [ ] Ô nhập điểm có kiểm tra tối đa; nút tải lên & xem trước minh chứng (lightbox ảnh / viewer PDF).
- [ ] Thanh tự tính tổng + gợi ý xếp loại (ngưỡng lấy từ API/cấu hình, không hard-code ở FE).
- [ ] Modal ký tay (`react-signature-canvas`): xóa nét, vẽ lại, xuất PNG base64 khi "Ký và Nộp".
- [ ] Lưu nháp tự động (debounce) + nút lưu thủ công; khóa chỉnh sửa khi `SUBMITTED`.
- [ ] Hiển thị lý do khi phiếu `REJECTED` và cho nộp lại.
- **AC:** SV hoàn tất một phiếu và nộp thành công; tổng điểm hiển thị khớp BE.

### Task 2.8: Chuông thông báo
- [ ] Chuông ở Header, badge số chưa đọc, dropdown danh sách, đánh dấu đã đọc, polling định kỳ (đề xuất 30–60s).
- **AC:** nộp phiếu ở tài khoản SV → chuông Lớp trưởng cập nhật trong chu kỳ polling.

## Tools / Spike

### Task 2.9: Spike kỹ thuật PDF (giảm rủi ro Sprint 3)
- [ ] Python: `POST /render` thật — `docxtpl` map JSON vào 1 phôi `.docx` mẫu → PDF (xác định cách chuyển Word→PDF trong container, ví dụ LibreOffice headless; ghi lại trong README).
- [ ] Java: `PythonRenderClient` gọi được `/render` (timeout, retry, lỗi → `502`).
- [ ] Java: thử nghiệm PDFBox chèn 1 ảnh vào tọa độ cố định, và **ký chứng nhận + DocMDP** bằng keystore tự ký (PKCS#12) trên PDF mẫu; kiểm tra mở được bằng Adobe/PDF reader.
- [ ] Ghi lại kết luận (cách làm, thư viện bổ sung nếu cần như BouncyCastle, các giới hạn) vào `docs/spike-pdf.md`.
- **AC:** có một PDF mẫu: render từ Word → chèn ảnh → khóa DocMDP → băm SHA-256 → hash ổn định khi băm lại cùng file.

### Sprint 2 — Kết thúc
- [ ] Demo: Admin tạo & kích hoạt biểu mẫu → SV chấm, đính minh chứng, ký, nộp → Lớp trưởng nhận thông báo.
- [ ] Chốt các câu hỏi nghiệp vụ còn treo (tổng điểm tiêu chí, xếp loại, vị trí ô ký trên phôi).

---

# SPRINT 3 — Workflow duyệt & Engine ký số PDF (Module 5)

**Mục tiêu:** Lớp trưởng và Trưởng Khoa duyệt/trả phiếu; hệ thống sinh PDF có 3 chữ ký, khóa DocMDP, băm SHA-256, lưu MinIO.

## Backend

### Task 3.1: Workflow State Machine
- [ ] `WorkflowService` hiện thực bảng chuyển trạng thái (`context.md` mục 7); từ chối chuyển không hợp lệ → `422 INVALID_TRANSITION`.
- [ ] `@Version` trên `score_forms`; xung đột → `409 CONCURRENT_UPDATE`.
- [ ] Phiếu `is_locked` → `409 FORM_LOCKED` cho mọi thao tác ghi.
- **AC (test):** ma trận chuyển trạng thái được test đầy đủ (hợp lệ/không hợp lệ theo role và trạng thái).

### Task 3.2: Hàng đợi duyệt
- [ ] `GET /workflow/pending-queue`: `CLASS_LEADER` thấy phiếu `SUBMITTED` của lớp mình; `DEAN` thấy phiếu `CLASS_APPROVED` của khoa mình; hỗ trợ tab "đang xử lý"/"đang chờ"; lọc & phân trang bằng `hibernateDao/`.
- [ ] `GET /workflow/forms/{id}`: chi tiết phiếu (điểm SV/Lớp, minh chứng, lịch sử `audit_logs`, chữ ký), kiểm tra phạm vi.
- **AC:** Lớp trưởng lớp A không thấy phiếu lớp B (kể cả đoán `id`) → 403.

### Task 3.3: Duyệt cấp Lớp & Trả phiếu
- [ ] `POST /workflow/class/approve`: cho chấm lại `class_score` từng tiêu chí (≤ `max_score`, tổng ≤ 100), lưu chữ ký (`signatures`), `signature_logs` order=2, → `CLASS_APPROVED`.
- [ ] `POST /workflow/reject`: **bắt buộc** `reject_reason`; → `REJECTED`; đánh dấu `is_revoked` chữ ký trước đó; audit; thông báo `REJECT` tới SV.
- [ ] Thông báo `APPROVE` khi Lớp duyệt → gửi Trưởng Khoa của khoa đó.
- **AC:** trả phiếu không có lý do → 400; sau khi trả, SV sửa và nộp lại được, chữ ký cũ không còn hiệu lực.

### Task 3.4: Python render — hoàn thiện
- [ ] `POST /render` hoàn chỉnh theo hợp đồng `context.md` mục 9; ánh xạ Field Code → placeholder; xử lý lỗi thiếu field (trả lỗi rõ ràng).
- [ ] Phôi Word chuẩn cho biểu mẫu ĐRL, có 3 vùng chừa trống cho chữ ký; ghi lại tọa độ.
- [ ] Healthcheck; log không chứa dữ liệu cá nhân thừa.
- **AC:** gửi JSON đủ field → PDF đúng dữ liệu; thiếu field → 422 mô tả field thiếu.

### Task 3.5: Engine PDF (`service/engine/`)
- [ ] `PythonRenderClient` (timeout, retry ≤ 2, lỗi → `RENDER_SERVICE_ERROR`).
- [ ] `PdfSignatureEngine`: chèn 3 ảnh chữ ký (SV, Lớp, Khoa) vào 3 ô tọa độ lấy từ cấu hình (`signature-slots.yml`) — **không hard-code**.
- [ ] `PdfLockEngine`: ký chứng nhận + DocMDP bằng keystore cấu hình qua biến môi trường.
- [ ] `PdfHashEngine`: SHA-256 trên **bản PDF cuối cùng**.
- [ ] (Tùy chọn, theo quyết định nghiệp vụ) chèn QR trỏ `PUBLIC_BASE_URL/verify/{scoreFormId}` ở bước chèn chữ ký.
- **AC:** unit test với PDF mẫu: đủ 3 ảnh đúng vị trí; PDF cuối bị phát hiện thay đổi khi sửa nội dung; hash lặp lại ổn định.

### Task 3.6: Duyệt lô cấp Khoa
- [ ] `POST /workflow/dean/approve-batch { ids[], signatureBase64 }`: với mỗi phiếu chạy pipeline: render → ký/chèn → khóa → băm → lưu MinIO `signed-pdfs` → cập nhật `pdf_file_url`, `pdf_hash_sha256`, `is_locked=TRUE`, `DEAN_APPROVED` → audit → thông báo `APPROVE` tới SV.
- [ ] **Mỗi phiếu một giao dịch riêng**; lỗi một phiếu không làm hỏng cả lô; trả kết quả từng phiếu (thành công/lỗi + mã lỗi).
- [ ] Nếu lưu MinIO thành công nhưng cập nhật DB lỗi → dọn file mồ côi (hoặc job dọn định kỳ).
- [ ] Giới hạn kích thước lô (đề xuất ≤ 50); vượt → `400` hoặc xử lý bất đồng bộ (xem rủi ro #4 `context.md`).
- **AC (integration):** lô 10 phiếu, 1 phiếu cố tình lỗi (thiếu chữ ký Lớp) → 9 thành công, 1 báo lỗi; PDF mở được, có 3 chữ ký, hash khớp DB.

### Task 3.7: Hoàn thiện thông báo & audit cho workflow
- [ ] Trigger đủ: nộp phiếu, Lớp duyệt, trả phiếu, Khoa duyệt hoàn tất.
- [ ] Mọi chuyển trạng thái có đúng một `audit_logs`.
- **AC:** truy vấn audit của một phiếu cho thấy đầy đủ chuỗi sự kiện theo thứ tự thời gian.

## Frontend

### Task 3.8: Hàng đợi & Split-screen duyệt
- [ ] Trang hàng đợi 2 tab: "Đang xử lý" / "Đang chờ duyệt"; phân trang 1-based; lọc.
- [ ] `components/split-screen/`: nửa trái form điểm (Lớp trưởng chấm lại được; Khoa chỉ xem), nửa phải viewer minh chứng (ảnh lightbox / PDF); chuyển nhanh giữa các minh chứng.
- [ ] Modal Trả phiếu (bắt buộc nhập lý do) và Modal Ký duyệt (canvas ký).
- **AC:** Lớp trưởng duyệt/trả một phiếu hoàn chỉnh; trạng thái cập nhật ngay trong hàng đợi.

### Task 3.9: Duyệt lô cấp Khoa
- [ ] Bảng chọn nhiều phiếu (checkbox), nút "Duyệt lô" → ký 1 lần → hiển thị tiến trình & kết quả từng phiếu (thành công/lỗi kèm lý do).
- [ ] Xem nhanh PDF kết quả (Quick View).
- **AC:** duyệt lô 10 phiếu, thấy báo cáo từng phiếu; phiếu lỗi vẫn ở hàng đợi.

### Task 3.10: Trạng thái & lịch sử cho Sinh viên
- [ ] Trang lịch sử phiếu: trạng thái, lý do trả (nếu có), timeline `audit_logs`, tải PDF đã ký khi `DEAN_APPROVED`.
- **AC:** SV thấy timeline đúng và tải được PDF cuối.

### Sprint 3 — Kết thúc
- [ ] **Demo end-to-end:** SV nộp → Lớp duyệt → Khoa duyệt lô → PDF 3 chữ ký, khóa DocMDP, hash SHA-256 trong DB và trên MinIO.
- [ ] Kiểm thử thủ công bản PDF bằng trình đọc PDF (xác nhận trạng thái chứng nhận/khóa).

---

# SPRINT 4 — Báo cáo, Tra cứu công khai, Hardening & Triển khai (Module 8)

**Mục tiêu:** báo cáo toàn trường, xuất Excel, trang verify công khai, bảo mật, kiểm thử toàn diện, đóng gói Docker.

## Backend

### Task 4.1: Module 8 — Báo cáo tổng hợp
- [ ] `GET /reports/aggregate`: lọc đa chiều (MSV, Lớp, Khoa, Khóa, Học kỳ, Xếp loại) — **cài ở `hibernateDao/`** bằng Criteria API, điều kiện tùy chọn ghép động; phân trang & sắp xếp.
- [ ] Phạm vi: `ADMIN` toàn trường; `DEAN` chỉ khoa mình (kể cả khi cố truyền `deptId` khác).
- [ ] Tối ưu truy vấn (fetch join/projection DTO, tránh N+1); kiểm tra chỉ mục.
- **AC:** lọc kết hợp 4 chiều trả đúng; DEAN truyền `deptId` khoa khác vẫn chỉ thấy khoa mình; dữ liệu 10.000 phiếu truy vấn < 2s (mục tiêu).

### Task 4.2: Xuất Excel & ZIP minh chứng
- [ ] `GET /reports/export-excel`: đúng thứ tự cột `STT | Họ và tên | Mã sinh viên | Khóa | Khoa | Lớp | Tổng điểm ĐRL | Xếp loại`; dùng POI streaming (`SXSSFWorkbook`).
- [ ] `GET /reports/forms/{id}/proofs`: ZIP minh chứng, stream từ MinIO, tên file trong ZIP không trùng/không chứa ký tự nguy hiểm.
- [ ] `GET /reports/forms/{id}/pdf`: trả PDF đã ký (kiểm tra quyền: ADMIN, DEAN đúng khoa, chủ phiếu).
- **AC:** file Excel mở được, đúng cột & thứ tự, tiếng Việt không lỗi font; ZIP giải nén đủ file.

### Task 4.3: Audit Trail & tra cứu lịch sử
- [ ] Rà soát: mọi thao tác duyệt/trả/khóa đều có `audit_logs`; bảng chỉ INSERT.
- [ ] `GET /audit/forms/{id}` (ADMIN, và đúng phạm vi) trả timeline.
- **AC:** không có đường nào đổi trạng thái mà không để lại audit.

### Task 4.4: Tra cứu công khai (`/verify`)
- [ ] `GET /public/verify/{scoreFormId}`: trả trạng thái, thời điểm duyệt, hash đã lưu; **dữ liệu tối thiểu** (che bớt mã SV nếu cần).
- [ ] `POST /public/verify/{scoreFormId}/check`: upload PDF → tính SHA-256 → so với DB → kết quả khớp/không khớp.
- [ ] Rate limit cho API công khai (ví dụ bucket4j hoặc bộ lọc đơn giản); giới hạn kích thước upload.
- **AC:** PDF gốc → "Khớp"; sửa 1 byte → "Không khớp"; id không tồn tại hoặc phiếu chưa `DEAN_APPROVED` → thông báo phù hợp, không lộ thông tin thừa.

### Task 4.5: Hardening bảo mật
- [ ] Rà soát toàn bộ endpoint: `@PreAuthorize` + kiểm tra phạm vi dữ liệu (checklist theo bảng API mục 10).
- [ ] Giới hạn upload (MIME, kích thước), chống path traversal, tên object UUID.
- [ ] Header bảo mật, CORS chặt theo môi trường; JWT secret từ môi trường; tắt Swagger ở production (hoặc bảo vệ).
- [ ] Không log dữ liệu nhạy cảm (JWT, base64, nội dung PDF).
- [ ] Kiểm tra thủ công OWASP cơ bản: IDOR (đổi `id`), mass assignment (DTO), injection (Criteria/param).
- **AC:** checklist bảo mật hoàn tất, có biên bản các điểm đã kiểm tra.

## Frontend

### Task 4.6: Bảng tổng hợp & báo cáo
- [ ] Data table báo cáo (cột nghiệp vụ + 2 cột thao tác): icon PDF (Quick View/tải), icon ZIP minh chứng.
- [ ] Bộ lọc đa chiều; nút "Xuất Excel" (tải `.xlsx`).
- [ ] Phân trang 1-based đúng quy ước.
- **AC:** lọc, xem PDF, tải ZIP, xuất Excel đều chạy end-to-end.

### Task 4.7: Trang Verify công khai
- [ ] Route `/verify/:scoreFormId` không cần đăng nhập; hiển thị kết quả; khu vực kéo-thả PDF để đối chiếu hash.
- **AC:** quét QR (nếu bật) hoặc mở link → thấy kết quả đối soát đúng.

### Task 4.8: Hoàn thiện trải nghiệm
- [ ] Trạng thái loading/empty/error nhất quán; thông báo lỗi theo mã lỗi chuẩn.
- [ ] Responsive cơ bản cho màn hình sinh viên (có thể ký trên thiết bị cảm ứng).
- [ ] Rà soát `messages.js`, không còn chuỗi hard-code.
- **AC:** sinh viên ký & nộp được trên điện thoại/tablet.

## Kiểm thử & Triển khai

### Task 4.9: Kiểm thử toàn diện
- [ ] Hoàn thiện unit/integration test theo `context.md` mục 14; service lõi ≥ 80% line coverage.
- [ ] Bộ test phân quyền theo ma trận role × endpoint × phạm vi.
- [ ] 1 kịch bản E2E đầy đủ (SV → Lớp → Khoa → PDF → Verify) — tự động (Playwright) hoặc checklist thủ công có biên bản.
- [ ] Kiểm thử tải nhẹ: duyệt lô 50 phiếu, export 10.000 dòng.
- **AC:** toàn bộ test pass trong CI/local; không còn bug mức Blocker/Critical.

### Task 4.10: Docker hoàn chỉnh & Production build
- [ ] Dockerfile multi-stage cho Backend (build JAR → chạy trên JRE 17 slim, user không phải root).
- [ ] Dockerfile cho Frontend (build tĩnh → Nginx, reverse proxy `/api` → backend).
- [ ] Dockerfile Python `word-parser` (kèm công cụ chuyển Word→PDF đã chốt ở spike).
- [ ] `docker-compose.yml` đủ 5 service (`postgres`, `minio` + khởi tạo bucket, `word-parser`, `backend-api`, `frontend-web`), healthcheck, `depends_on` theo health, volume dữ liệu, Python **không publish port** ra host.
- [ ] Profile `prod`: tắt seed, tắt Swagger, JWT/keystore/MinIO key từ secret.
- [ ] `README.md` (cách chạy, biến môi trường, tạo keystore dev), cập nhật `project_structure.md` nếu cấu trúc đổi.
- **AC:** máy sạch: `docker compose up --build` → đăng nhập, chạy trọn kịch bản E2E, xuất Excel, verify hash.

### Task 4.11: Bàn giao
- [ ] Tài liệu vận hành: backup PostgreSQL/MinIO, xoay vòng JWT secret, gia hạn keystore.
- [ ] Hướng dẫn sử dụng ngắn theo 4 role.
- [ ] Biên bản nghiệm thu theo 3 bài toán lõi.

### Sprint 4 — Kết thúc
- [ ] Demo nghiệm thu toàn hệ thống.
- [ ] Ghi nhận backlog sau phát hành (xử lý PDF bất đồng bộ, chữ ký số CA chính thức, đa ngôn ngữ...).

---

## 7. Ma trận Module ↔ Sprint

| # | Module | Sprint | Task chính (BE / FE) |
|---|---|---|---|
| 1 | Auth & RBAC | 1 (+ rà soát ở 4) | 1.6 / 1.9 · 4.5 |
| 2 | Danh bạ đơn vị (Import Excel) | 1 | 1.7 / 1.10 |
| 3 | Phiên bản biểu mẫu (JSON Layout) | 2 | 2.1, 2.2 / 2.6 |
| 4 | Field Code | 1 | 1.8 / 1.11 |
| 5 | Hàng đợi & Phê duyệt (Checker) + Engine PDF | 3 | 3.1–3.7 / 3.8–3.10 |
| 6 | Thông báo | 2 (hoàn thiện ở 3) | 2.4, 3.7 / 2.8 |
| 7 | Soạn thảo (Maker) | 2 | 2.3 / 2.7 |
| 8 | Báo cáo toàn trường (`hibernateDao/`) | 4 | 4.1, 4.2 / 4.6 |
| — | Audit, Verify công khai, Hardening, Docker | 2–4 | 2.5, 4.3, 4.4, 4.5, 4.10 |

---

## 8. Quản lý rủi ro & phụ thuộc

| # | Rủi ro / phụ thuộc | Ảnh hưởng | Giảm thiểu | Chủ động từ |
|---|---|---|---|---|
| 1 | Word→PDF trong container (LibreOffice) lệch bố cục/font tiếng Việt | PDF sai định dạng | Spike Task 2.9; nhúng font tiếng Việt vào image; test với phôi thật sớm | Sprint 2 |
| 2 | DocMDP + keystore khó cấu hình | Trễ Sprint 3 | Spike Task 2.9; dùng keystore tự ký khi dev; hỏi nhà trường về chứng thư production | Sprint 2 |
| 3 | Vị trí 3 ô chữ ký phụ thuộc phôi cuối cùng | Làm lại tọa độ | Cấu hình `signature-slots.yml`; chốt phôi trước Sprint 3 | Cuối Sprint 2 |
| 4 | Quy chế xếp loại/tổng điểm chưa chốt | Sai nghiệp vụ | Cấu hình ngưỡng; xác nhận với Phòng Đào tạo | Sprint 2 |
| 5 | Duyệt lô lớn chậm | Timeout | Giới hạn lô, giao dịch từng phiếu, cân nhắc `@Async` | Sprint 3 |
| 6 | Bản NodeJS cũ không tái sử dụng được code | Ước lượng thấp | Dùng làm checklist chức năng và mô hình miền; ước lượng như làm mới | Sprint 1 |
| 7 | Frontend phụ thuộc hợp đồng API | Chờ nhau | Chốt DTO + Swagger đầu mỗi sprint; FE dùng mock tạm | Mỗi sprint |
| 8 | Một người đảm nhiệm nhiều vai (BE/FE/Python) | Nghẽn cổ chai | Ưu tiên đường găng; cắt phạm vi "Tùy chọn" (QR, responsive) trước khi cắt kiểm thử | Mỗi sprint |

**Quy tắc cắt phạm vi nếu trễ:** ưu tiên giữ đường găng và kiểm thử/bảo mật; có thể hoãn theo thứ tự: (1) QR trong PDF, (2) responsive nâng cao, (3) ZIP minh chứng, (4) lưu nháp tự động.
