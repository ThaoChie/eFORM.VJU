# PROMPT CHO AGENT: CẤU HÌNH DEPLOY DEMO E-DRL (Vercel + Render + Neon + Cloudflare R2)

> **Mục đích:** nhờ agent lập trình (Cursor, Claude Code, Copilot...) chuẩn bị toàn bộ mã nguồn và cấu hình để đưa bản **demo** của hệ thống E-DRL lên 4 nền tảng miễn phí, cho 4 thành viên nhóm vào kiểm thử.
> **Cách dùng:** mở đúng thư mục gốc monorepo, đính kèm `context.md`, `project_structure.md`, `task.md`, rồi dán phần giữa hai dòng **BẮT ĐẦU PROMPT** và **KẾT THÚC PROMPT**. Phần "Việc người dùng phải tự làm" ở cuối là các bước agent không làm thay được (tạo tài khoản, dán bí mật).
> **Lưu ý:** các giá trị cấu hình nền tảng trong prompt được tra cứu tháng 10/2026. Prompt đã dặn agent đối chiếu tài liệu chính thức khi có khác biệt.

---

## BẮT ĐẦU PROMPT

# VAI TRÒ

Bạn là Senior DevOps/Backend Engineer. Hãy chuẩn bị mã nguồn và cấu hình để triển khai **bản demo** hệ thống E-Form Điểm Rèn Luyện (E-DRL) lên các gói **miễn phí**. Bạn **không có quyền đăng nhập** Vercel, Render, Neon, Cloudflare. Mọi thao tác trên dashboard phải được viết thành checklist cho người dùng (xem Phase 5), không được giả định đã làm.

# BỐI CẢNH

- Monorepo 3 phần (xem `project_structure.md`): `frontend-react/` (React 18, Vite, Ant Design v5, Zustand), `backend-springboot/` (Spring Boot 3, Java 17, Spring Data JPA, Flyway, Spring Security JWT, PDFBox, POI), `tools/word-parser/` (FastAPI + `docxtpl`, chuyển Word sang PDF bằng LibreOffice).
- Môi trường chạy cục bộ hiện tại là `docker-compose.yml` (PostgreSQL, MinIO, word-parser, backend-api, frontend-web). **Phải giữ nguyên khả năng chạy cục bộ này.**
- Mục tiêu: demo cho 4 người dùng thử trong thời gian ngắn. Không phải production, không có dữ liệu thật của sinh viên.
- Quy ước dự án bắt buộc tuân theo: `ApiResponse` qua `Wrapper/`, DTO ở `dto/request` và `dto/response`, `StorageService` là điểm duy nhất truy cập lưu trữ file, phân trang FE 1-based và BE 0-based, không hard-code bí mật, chuỗi giao diện ở `common/messages.js`.

# KIẾN TRÚC ĐÍCH

| Thành phần | Nền tảng | Ghi chú |
|---|---|---|
| Frontend | **Vercel** (gói Hobby) | Gọi **trực tiếp** API Render bằng CORS, không dùng rewrite ngoài (lý do: lần gọi đầu có thể chờ đánh thức dịch vụ rất lâu, chưa kiểm chứng giới hạn thời gian của rewrite ngoài) |
| Spring Boot | **Render** web service Docker, `plan: free` | 512 MB RAM, tự ngủ sau 15 phút không có truy cập |
| Python word-parser | **Render** web service Docker, `plan: free` | **Mở public** vì Render miễn phí không có mạng nội bộ; bảo vệ bằng khóa bí mật |
| PostgreSQL | **Neon** (gói miễn phí) | Tự ngủ sau 5 phút không có truy vấn; dùng chuỗi kết nối **direct** (không có `-pooler`) |
| File (minh chứng, chữ ký, PDF) | **Cloudflare R2** | API tương thích S3; thay MinIO khi deploy; MinIO vẫn dùng cho chạy cục bộ |

# RÀNG BUỘC (KHÔNG ĐƯỢC VI PHẠM)

1. **Không đổi nghiệp vụ**, không đổi API, không đổi cấu trúc thư mục đã chốt.
2. **Không dùng dịch vụ trả phí**, không thêm dịch vụ ngoài 4 nền tảng trên.
3. **Không thêm cron hoặc ping giữ thức.** Các dịch vụ miễn phí của Render dùng chung 750 giờ chạy mỗi tháng, hai dịch vụ chạy liên tục sẽ cạn giờ trong khoảng nửa tháng.
4. **Không commit bí mật** (mật khẩu, khóa JWT, khóa R2, chuỗi kết nối Neon, keystore). Chỉ commit `.env.example`.
5. **Giữ nguyên chạy cục bộ:** `docker compose up --build` với cấu hình mặc định vẫn dùng MinIO và PostgreSQL trong compose.
6. Dịch vụ phải **stateless**: không ghi file bền vững vào ổ đĩa của container (Render miễn phí là container tạm). Chỉ dùng thư mục tạm cho xử lý trung gian.
7. Nếu tài liệu chính thức của Render, Vercel, Neon hoặc Cloudflare R2 **khác** với giả định trong prompt này, làm theo tài liệu chính thức và **nêu rõ chỗ khác** trong báo cáo cuối.
8. Gặp điểm chưa rõ về mã hiện có (tên lớp, tên bean, cấu trúc cấu hình): **đọc mã trước**, không đoán. Nếu vẫn mâu thuẫn, dừng và hỏi.

# CÁCH LÀM VIỆC

Làm lần lượt Phase 0 đến Phase 6. Sau mỗi phase, chạy build và test liên quan, ghi kết quả. Mỗi phase là một commit riêng, thông điệp commit bằng tiếng Anh ngắn gọn. Không gộp thay đổi không liên quan.

---

## PHASE 0: KHẢO SÁT (không sửa mã)

1. Đọc `context.md`, `project_structure.md`, `task.md`, `docker-compose.yml`, `.env.example`.
2. Xác nhận và liệt kê vị trí thật của: `StorageService` (và bản cài MinIO), `SecurityConfig`, `application.yml`, `PythonRenderClient`, cấu hình CORS hiện có, cấu hình Flyway, seeder dữ liệu mẫu, `lib/axios/client.js`, `tools/word-parser/main.py` và Dockerfile của từng phần.
3. Ghi lại phiên bản Java, Spring Boot, Node, Python, thư viện MinIO, PDFBox đang dùng.
4. Xuất kế hoạch ngắn (tối đa 20 dòng) nêu file sẽ thêm hoặc sửa. Nếu phát hiện điều mâu thuẫn với prompt này, nêu ngay trong kế hoạch rồi tiếp tục theo hướng ít rủi ro nhất.

---

## PHASE 1: BACKEND SPRING BOOT

### 1.1 Profile `demo` và cấu hình qua biến môi trường

Tạo `application-demo.yml`, **mọi giá trị đến từ biến môi trường**. Phần cốt lõi:

```yaml
server:
  port: ${PORT:8080}          # Render truyền PORT (mặc định 10000); phải lắng nghe 0.0.0.0
spring:
  main:
    lazy-initialization: false   # xem Phase 6, chỉ bật nếu khởi động quá chậm
  datasource:
    url: ${SPRING_DATASOURCE_URL}        # dạng jdbc:postgresql://<host-direct>/<db>?sslmode=require
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}
    hikari:
      maximum-pool-size: 4
      minimum-idle: 0
      connection-timeout: 60000     # đủ thời gian cho Neon thức dậy
      max-lifetime: 240000          # ngắn hơn thời gian Neon ngủ (5 phút) để tránh kết nối chết
      idle-timeout: 120000
  jpa:
    open-in-view: false
    hibernate:
      ddl-auto: validate
  flyway:
    enabled: true
    clean-disabled: true
management:
  endpoints:
    web:
      exposure:
        include: health
```

Yêu cầu kèm theo:
- Chuỗi kết nối Neon dạng `postgresql://user:pass@host/db?sslmode=require...` phải được **chuyển** thành `jdbc:postgresql://host/db?sslmode=require` với username và password tách riêng. Nếu driver từ chối tham số `channel_binding`, bỏ tham số này.
- Dùng chuỗi kết nối **direct** (host **không** có `-pooler`) cho cả ứng dụng và Flyway. Lý do: bộ gộp kết nối của Neon chạy chế độ transaction, không hỗ trợ tính năng theo phiên (ví dụ prepared statement của JDBC), còn migration cần kết nối direct. Ghi lý do này vào `DEPLOY.md`.
- Thêm `spring-boot-starter-actuator` nếu chưa có, **chỉ** mở endpoint `health`, và cho phép truy cập không cần đăng nhập ở `SecurityConfig` đối với `/actuator/health`.
- Swagger/springdoc: tắt mặc định ở profile `demo`, bật bằng biến `SWAGGER_ENABLED=true`.
- Tắt log SQL và không log JWT, base64 chữ ký, nội dung PDF (khớp tiêu chí DoD B-10).

### 1.2 Lưu trữ file sang Cloudflare R2

- Giữ nguyên interface `StorageService`. Thêm bản cài `S3StorageService` dùng **AWS SDK for Java v2** (`software.amazon.awssdk:s3`, dùng HTTP client nhẹ), cấu hình:
  - `endpointOverride`: `S3_ENDPOINT` (dạng `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`)
  - `region`: `S3_REGION` (mặc định `auto`)
  - thông tin xác thực tĩnh từ `S3_ACCESS_KEY`, `S3_SECRET_KEY`
  - **path-style access bật** (`forcePathStyle(true)`)
  - presign bằng `S3Presigner` nếu hiện đang dùng URL tạm.
- Chọn bản cài bằng thuộc tính `storage.provider` (`minio` mặc định cho chạy cục bộ, `s3` cho demo) bằng `@ConditionalOnProperty`. **Không xóa** bản MinIO.
- Tên 3 bucket đọc từ biến: `S3_BUCKET_PROOFS`, `S3_BUCKET_SIGNATURES`, `S3_BUCKET_SIGNED_PDFS`.
- **Không tạo bucket tự động khi `storage.provider=s3`**: chỉ kiểm tra bucket tồn tại và ghi log lỗi rõ ràng nếu thiếu (bucket R2 do người dùng tạo tay).
- Giữ nguyên quy tắc đặt tên object bằng UUID, kiểm tra MIME theo nội dung, giới hạn dung lượng (khớp DoD G1).
- Viết test cho `S3StorageService` (có thể dùng Testcontainers với MinIO để mô phỏng S3, vì chưa có R2 trong CI).

### 1.3 CORS

- Cấu hình `CorsConfigurationSource` đọc `CORS_ALLOWED_ORIGINS` (danh sách phân tách bằng dấu phẩy). Cho phép các header `Authorization`, `Content-Type`, các phương thức GET, POST, PUT, PATCH, DELETE, OPTIONS; `allowCredentials=false` (JWT đi bằng header); `maxAge` 3600 giây.
- Tùy chọn `CORS_ALLOWED_ORIGIN_PATTERNS` (ví dụ `https://*.vercel.app`) **tắt mặc định**, chỉ dùng cho bản xem trước (preview) của Vercel. Ghi cảnh báo trong `DEPLOY.md`: mẫu này cho phép mọi dự án trên vercel.app gọi API, vẫn cần JWT.
- Đảm bảo yêu cầu `OPTIONS` (preflight) không bị `SecurityConfig` chặn.

### 1.4 Gọi dịch vụ Python

- `PythonRenderClient` đọc `RENDER_SERVICE_URL`, `RENDER_SERVICE_KEY`, `RENDER_TIMEOUT_MS`.
- Gửi header **`X-Internal-Key: <RENDER_SERVICE_KEY>`** trong mọi yêu cầu.
- Timeout mặc định **120000 ms** cho demo (đủ cho lần đánh thức dịch vụ ngủ); thử lại tối đa 2 lần, có giãn cách tăng dần, với lỗi mạng, 502, 503 và timeout.
- Hết lần thử vẫn lỗi thì trả mã lỗi chuẩn `RENDER_SERVICE_ERROR` (HTTP 502), **phiếu giữ nguyên trạng thái** (khớp DoD G3-01).

### 1.5 Endpoint đánh thức

Thêm endpoint công khai, rất nhẹ, không cần đăng nhập:
- `GET /api/v1/system/warmup` trả `ApiResponse` với `{ "status": "UP" }`.
- `GET /api/v1/system/warmup?python=true` ngoài ra **gọi bất đồng bộ** `GET /health` của dịch vụ Python (không chờ kết quả, bỏ qua lỗi) để đánh thức dịch vụ này.
- Giới hạn tần suất đơn giản (ví dụ tối đa 30 yêu cầu mỗi phút mỗi địa chỉ IP) để tránh bị lạm dụng.

### 1.6 Keystore khóa PDF (DocMDP)

- Đọc keystore từ biến `KEYSTORE_BASE64`: giải mã thành file trong thư mục tạm lúc khởi động, rồi dùng `KEYSTORE_PASSWORD` và `KEY_ALIAS`. Không cần file keystore trong repo.
- Viết script `scripts/gen-dev-keystore.sh` tạo keystore PKCS#12 tự ký bằng `keytool` và in ra chuỗi base64 để người dùng dán vào Render. Ghi rõ trong `DEPLOY.md`: **chứng thư tự ký chỉ dùng cho demo**, trình đọc PDF sẽ báo chưa xác minh người ký nhưng vẫn phát hiện việc sửa file.

### 1.7 Dữ liệu mẫu cho nhóm thử

- Thêm `DemoDataSeeder`, chỉ chạy khi profile `demo` và **chỉ khi bảng `users` đang rỗng** (chạy lặp lại không nhân đôi dữ liệu).
- Tạo: 1 Khoa, 1 Phòng ban, 1 Lớp, 1 học kỳ đang hoạt động, 1 biểu mẫu ACTIVE với vài tiêu chí mẫu, và tài khoản cho đủ vai trò: Admin (thuộc Phòng ban), Trưởng Khoa, Lớp trưởng, Lớp phó, 2 sinh viên. Email dạng `*.demo@drl.example`.
- Mật khẩu **lấy từ biến `DEMO_SEED_PASSWORD`**, không viết cứng. Không in mật khẩu ra log.
- Tạo sẵn ảnh chữ ký mẫu nhỏ (PNG sinh bằng mã) cho Admin, Trưởng Khoa, Lớp trưởng, Lớp phó, lưu vào bucket `signatures`, để thử luồng ký ngay.
- Nếu trong mã hiện tại chưa có Phòng ban, chức vụ Lớp phó hoặc quyền cộng dồn (theo thiết kế Danh bạ đơn vị), chỉ tạo phần dữ liệu mà mã hiện tại hỗ trợ và **nêu rõ phần bỏ qua** trong báo cáo.

### 1.8 Dockerfile backend

Tạo hoặc cập nhật `backend-springboot/Dockerfile`, build nhiều giai đoạn:
- Giai đoạn build: Maven với JDK 17.
- Giai đoạn chạy: JRE 17 gọn, chạy bằng người dùng không phải root.
- Đặt tùy chọn bộ nhớ cho 512 MB, ví dụ:

```dockerfile
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=60 -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Xss512k -XX:MaxMetaspaceSize=128m"
```

- `EXPOSE` đúng cổng; ứng dụng đọc `PORT`.
- Mặc định `SPRING_PROFILES_ACTIVE=demo` trong cấu hình Render, **không** bake vào image (chạy cục bộ vẫn dùng profile mặc định).

**Kiểm tra cuối phase:** `mvn test` đạt; ứng dụng khởi động với profile `demo` trỏ vào một PostgreSQL và một MinIO cục bộ (dùng Testcontainers hoặc compose) và Flyway chạy sạch.

---

## PHASE 2: DỊCH VỤ PYTHON

### 2.1 Bảo vệ bằng khóa bí mật

- Middleware FastAPI: mọi đường dẫn **trừ `GET /health`** yêu cầu header `X-Internal-Key` khớp biến `INTERNAL_API_KEY` (so sánh bằng `hmac.compare_digest`). Thiếu hoặc sai trả **401**, không lộ lý do chi tiết.
- Giới hạn kích thước body (ví dụ tối đa 5 MB) và thời gian xử lý mỗi yêu cầu.

### 2.2 Chuyển Word sang PDF trong 512 MB

- Gọi LibreOffice headless với hồ sơ người dùng đặt trong thư mục tạm, ví dụ `-env:UserInstallation=file:///tmp/lo_profile`, thư mục làm việc riêng cho mỗi yêu cầu, có timeout, và **chỉ một chuyển đổi tại một thời điểm** (semaphore) để tránh hết bộ nhớ.
- Cài font có dấu tiếng Việt vào image (ví dụ `fonts-dejavu`, `fonts-liberation`) và **kiểm chứng PDF xuất ra hiển thị đúng dấu**.
- Dockerfile: `python:3.12-slim`, cài `libreoffice-writer` với `--no-install-recommends`, dọn cache `apt`, lắng nghe `0.0.0.0:$PORT`.

### 2.3 Đo thử và báo cáo (bắt buộc)

- Đo **mức RAM đỉnh** và thời gian khi chuyển một phôi mẫu (chạy container với giới hạn `--memory=512m`).
- Nếu RAM đỉnh gần hoặc vượt ~450 MB, hoặc tiến trình bị hệ thống kết thúc: **không tự đổi thiết kế**. Ghi vào báo cáo cuối các phương án (ví dụ nâng cấp riêng dịch vụ Python lên gói trả phí, hoặc thay công cụ tạo PDF), kèm số liệu đo được, rồi để người dùng quyết.

---

## PHASE 3: FRONTEND

1. `VITE_API_BASE_URL` đọc từ môi trường; **không** viết cứng URL. Cập nhật `.env.example`.
2. `lib/axios/client.js`: timeout mặc định 60 giây; riêng các lệnh gọi duyệt lô và sinh PDF dùng timeout 180 giây. Giữ nguyên interceptor JWT và xử lý 401/403.
3. **Đánh thức khi mở ứng dụng:** ngay khi tải trang, gọi nền `GET /system/warmup` (không cần đăng nhập). Nếu sau **5 giây** chưa có phản hồi, hiện banner ở đầu trang: "Máy chủ demo đang khởi động, có thể mất 1–2 phút. Vui lòng chờ." Ẩn banner khi có phản hồi. Chuỗi hiển thị đặt trong `common/messages.js`.
4. **Đánh thức Python:** khi Trưởng Khoa mở màn hình duyệt lô, gọi nền `GET /system/warmup?python=true`.
5. Xử lý timeout và lỗi mạng ở màn hình đăng nhập bằng thông báo thân thiện, cho phép thử lại.
6. Thêm `frontend-react/vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

   (chỉ để hỗ trợ điều hướng phía trình duyệt của React Router; **không** chuyển tiếp `/api`).
7. Đảm bảo `npm run build` ra thư mục `dist` và `npm run test` đạt.

---

## PHASE 4: BLUEPRINT RENDER VÀ BIẾN MÔI TRƯỜNG

### 4.1 `render.yaml` ở gốc repo

Tạo Blueprint hai dịch vụ. Khung (đối chiếu với lược đồ chính thức `https://render.com/schema/render.yaml.json`, kiểm tra đường dẫn Dockerfile và giá trị `region` hợp lệ):

```yaml
services:
  - type: web
    name: drl-word-parser
    runtime: docker
    plan: free
    region: singapore              # ưu tiên gần Việt Nam; nếu không hợp lệ, chọn vùng gần nhất và đặt cùng vùng với Neon
    dockerfilePath: ./tools/word-parser/Dockerfile
    dockerContext: ./tools/word-parser
    healthCheckPath: /health
    autoDeploy: true
    envVars:
      - key: INTERNAL_API_KEY
        sync: false                # người dùng nhập khi triển khai

  - type: web
    name: drl-backend
    runtime: docker
    plan: free
    region: singapore
    dockerfilePath: ./backend-springboot/Dockerfile
    dockerContext: ./backend-springboot
    healthCheckPath: /actuator/health
    autoDeploy: true
    envVars:
      - key: SPRING_PROFILES_ACTIVE
        value: demo
      - key: STORAGE_PROVIDER
        value: s3
      - key: S3_REGION
        value: auto
      - key: RENDER_TIMEOUT_MS
        value: "120000"
      # các biến còn lại: sync: false (xem bảng bên dưới)
```

### 4.2 Bảng biến môi trường

Liệt kê đủ trong `.env.example` và `DEPLOY.md`. Biến bí mật dùng `sync: false` trong Blueprint.

**Dịch vụ `drl-backend` (Render)**

| Biến | Giá trị / nguồn | Bí mật |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `demo` | Không |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<host-direct-neon>/<db>?sslmode=require` | Có |
| `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` | Từ Neon | Có |
| `JWT_SECRET`, `JWT_EXPIRATION_MS` | Chuỗi ngẫu nhiên dài (ví dụ `openssl rand -base64 48`), 28800000 | Có (`JWT_SECRET`) |
| `STORAGE_PROVIDER` | `s3` | Không |
| `S3_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` | Không |
| `S3_REGION` | `auto` | Không |
| `S3_ACCESS_KEY`, `S3_SECRET_KEY` | Từ API token R2 | Có |
| `S3_BUCKET_PROOFS`, `S3_BUCKET_SIGNATURES`, `S3_BUCKET_SIGNED_PDFS` | Tên 3 bucket R2 | Không |
| `RENDER_SERVICE_URL` | `https://<drl-word-parser>.onrender.com` | Không |
| `RENDER_SERVICE_KEY` | Trùng `INTERNAL_API_KEY` bên Python | Có |
| `RENDER_TIMEOUT_MS` | `120000` | Không |
| `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS` | Từ `scripts/gen-dev-keystore.sh` | Có |
| `PUBLIC_BASE_URL` | URL Vercel | Không |
| `CORS_ALLOWED_ORIGINS` | URL Vercel (có thể nhiều giá trị, phân tách bằng dấu phẩy) | Không |
| `DEMO_SEED_PASSWORD` | Mật khẩu chung cho tài khoản mẫu | Có |
| `SWAGGER_ENABLED` | `false` | Không |

**Dịch vụ `drl-word-parser` (Render):** `INTERNAL_API_KEY` (bí mật).
**Frontend (Vercel):** `VITE_API_BASE_URL` = `https://<drl-backend>.onrender.com/api/v1`.

---

## PHASE 5: TÀI LIỆU `DEPLOY.md` (tiếng Việt, cho người thực hiện)

Viết `docs/DEPLOY.md` ở dạng danh sách bước đánh số, mỗi bước nêu **việc cần làm, giá trị cần điền, cách kiểm tra**. Theo đúng thứ tự (để giải quyết phụ thuộc vòng giữa Render và Vercel):

1. **Neon:** tạo project và database; lấy chuỗi kết nối **direct**; ghi chú cách chuyển sang URL JDBC.
2. **Cloudflare R2:** tạo 3 bucket (`proofs`, `signatures`, `signed-pdfs`), tạo API token quyền đọc và ghi cho 3 bucket, lấy Account ID, access key, secret key. Cấu hình CORS cho bucket nếu giao diện đọc file trực tiếp qua URL tạm (ví dụ JSON mẫu, kiểm tra định dạng theo giao diện R2 hiện hành):

```json
[{ "AllowedOrigins": ["https://<domain-vercel>"], "AllowedMethods": ["GET", "HEAD"], "AllowedHeaders": ["*"], "MaxAgeSeconds": 3600 }]
```

3. **Sinh bí mật:** chạy `scripts/gen-dev-keystore.sh`; tạo `JWT_SECRET`, `INTERNAL_API_KEY`, `DEMO_SEED_PASSWORD`.
4. **Render, dịch vụ Python:** triển khai từ Blueprint, nhập `INTERNAL_API_KEY`; kiểm tra `GET /health`; ghi lại URL.
5. **Render, dịch vụ backend:** nhập toàn bộ biến ở bảng 4.2 (tạm đặt `CORS_ALLOWED_ORIGINS` và `PUBLIC_BASE_URL` là `http://localhost:5173`); kiểm tra `GET /actuator/health`; ghi lại URL.
6. **Vercel:** nhập kho mã nguồn, **Root Directory** = `frontend-react`, Framework Preset = Vite, thêm `VITE_API_BASE_URL`; triển khai và ghi lại URL.
7. **Quay lại Render backend:** cập nhật `CORS_ALLOWED_ORIGINS` và `PUBLIC_BASE_URL` thành URL Vercel; để dịch vụ tự triển khai lại.
8. **Chạy kiểm tra nhanh** bằng `scripts/smoke-test.sh` (Phase 6) và checklist thủ công.
9. Mục "Xử lý sự cố": ngủ và khởi động chậm, Neon đánh thức, lỗi CORS, lỗi 401 từ Python, hết RAM ở Python, quên cập nhật CORS sau khi đổi URL.
10. Mục "Giới hạn của bản demo": dịch vụ ngủ sau 15 phút, hạn mức giờ chạy dùng chung, không có sao lưu, dữ liệu mẫu chỉ để thử, **không dùng dữ liệu thật của sinh viên**, chứng thư tự ký, gói Vercel Hobby chỉ dành cho mục đích phi thương mại.

---

## PHASE 6: KIỂM TRA

### 6.1 Script `scripts/smoke-test.sh`

Nhận `FRONTEND_URL`, `BACKEND_URL`, `PYTHON_URL`, `INTERNAL_API_KEY`, `DEMO_ADMIN_EMAIL`, `DEMO_SEED_PASSWORD`. Dùng `curl`, thoát mã khác 0 khi bất kỳ bước nào sai, in kết quả từng bước:
1. `GET {BACKEND_URL}/api/v1/system/warmup` trả 200 (cho phép chờ lâu lần đầu: timeout 180 giây).
2. `GET {PYTHON_URL}/health` trả 200.
3. Gọi một endpoint của Python **không có** header khóa: trả 401.
4. Preflight CORS: `OPTIONS` tới `/api/v1/auth/login` với `Origin: {FRONTEND_URL}`, kiểm tra header `Access-Control-Allow-Origin` khớp; với `Origin` lạ thì không khớp.
5. Đăng nhập bằng tài khoản mẫu, nhận token; gọi `GET /api/v1/auth/me` thành công.
6. Tải lên một ảnh PNG nhỏ làm minh chứng, kiểm tra trả về thành công (nhắc người dùng xác nhận file xuất hiện trong bucket `proofs` ở R2).

### 6.2 Checklist nghiệm thu thủ công (đưa vào `DEPLOY.md`)

```text
[ ] Mở URL Vercel: thấy banner "đang khởi động" khi máy chủ đang ngủ, tự ẩn khi sẵn sàng
[ ] Đăng nhập được bằng cả 6 tài khoản mẫu; mỗi vai trò thấy đúng menu
[ ] Sinh viên mở phiếu, nhập điểm, tải minh chứng (file xuất hiện ở R2), ký và nộp
[ ] Lớp trưởng hoặc Lớp phó duyệt được, có nhận xét đánh giá; phiếu của Lớp trưởng do Lớp phó duyệt
[ ] Trưởng Khoa duyệt lô: PDF có 3 chữ ký, lưu ở bucket signed-pdfs; hash SHA-256 khớp khi tính lại
[ ] Sau 20 phút không dùng: lần mở tiếp theo vẫn vào được (ghi lại thời gian chờ thực tế)
[ ] Trang xác thực công khai hoạt động, đối chiếu PDF đúng/sai
[ ] Không có bí mật nào trong lịch sử git (chạy công cụ quét bí mật nếu có)
[ ] docker compose up --build cục bộ vẫn chạy như trước
```

---

# TIÊU CHÍ HOÀN THÀNH

Công việc chỉ hoàn thành khi **tất cả** đúng:
1. Có đủ file: `render.yaml`, `frontend-react/vercel.json`, `application-demo.yml`, `S3StorageService`, cấu hình CORS, endpoint warmup, middleware khóa bí mật ở Python, `DemoDataSeeder`, các Dockerfile, `scripts/gen-dev-keystore.sh`, `scripts/smoke-test.sh`, `docs/DEPLOY.md`, `.env.example` cập nhật.
2. `mvn test` và `npm run test` đạt; `npm run build` thành công.
3. Chạy cục bộ với compose mặc định vẫn hoạt động (MinIO và PostgreSQL cục bộ).
4. Chạy profile `demo` cục bộ được (trỏ vào PostgreSQL và dịch vụ tương thích S3 cục bộ), Flyway sạch, seeder chạy lặp lại không nhân đôi dữ liệu.
5. Không còn chuỗi bí mật hay URL thật trong mã và lịch sử commit của bạn.
6. Đã đo RAM đỉnh của dịch vụ Python với giới hạn 512 MB và đã báo cáo.

# ĐỊNH DẠNG BÁO CÁO CUỐI (bắt buộc)

Trả về, bằng tiếng Việt, theo thứ tự:
1. **Danh sách file đã thêm hoặc sửa** (bảng: đường dẫn, mục đích).
2. **Bảng biến môi trường** thực tế đã dùng (tên, nơi đặt, có bí mật không).
3. **Kết quả đo**: thời gian khởi động Spring Boot với giới hạn 512 MB, RAM đỉnh và thời gian chuyển Word sang PDF của Python.
4. **Điểm khác với prompt này** (nếu tài liệu chính thức hoặc mã hiện có khác với giả định).
5. **Rủi ro và việc cần quyết** (ví dụ Python vượt RAM, thời gian khởi động quá chậm).
6. **Các bước người dùng phải tự làm**, trỏ tới `docs/DEPLOY.md`.

## KẾT THÚC PROMPT

---

# VIỆC NGƯỜI DÙNG PHẢI TỰ LÀM (agent không làm thay được)

| # | Việc | Ở đâu | Cần chuẩn bị |
|---|---|---|---|
| 1 | Tạo tài khoản và project database | Neon | Chuỗi kết nối **direct** (không có `-pooler`) |
| 2 | Tạo 3 bucket, API token đọc/ghi, cấu hình CORS | Cloudflare R2 | Account ID, access key, secret key |
| 3 | Sinh `JWT_SECRET`, `INTERNAL_API_KEY`, `DEMO_SEED_PASSWORD`, keystore | Máy cá nhân | `openssl`, `keytool` |
| 4 | Kết nối kho mã nguồn và triển khai Blueprint (2 dịch vụ) | Render | Quyền truy cập GitHub |
| 5 | Nhập các biến bí mật | Render | Bảng biến ở Phase 4.2 |
| 6 | Tạo project, đặt Root Directory `frontend-react`, thêm `VITE_API_BASE_URL` | Vercel | URL backend Render |
| 7 | Cập nhật `CORS_ALLOWED_ORIGINS`, `PUBLIC_BASE_URL` sau khi có URL Vercel | Render | URL Vercel |
| 8 | Chạy `scripts/smoke-test.sh` và checklist nghiệm thu | Máy cá nhân | Tài khoản mẫu |

**Ba điều cần lưu ý khi chạy thật**
- Lần mở đầu tiên (hoặc sau 15 phút không dùng) có thể chờ rất lâu vì cả Spring Boot và Python đều ngủ, kèm Neon thức dậy. Hãy hẹn nhóm test "mở trang trước vài phút".
- Nếu dịch vụ Python hết bộ nhớ khi chuyển Word sang PDF, luồng duyệt Trưởng Khoa sẽ lỗi. Đây là rủi ro lớn nhất của phương án này, nên phải xem kết quả đo ở báo cáo của agent.
- Gói Vercel Hobby chỉ dành cho mục đích phi thương mại; demo đồ án thì phù hợp.
