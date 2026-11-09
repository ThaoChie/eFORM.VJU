# 📚 Chuẩn Cấu Trúc Thư Mục Dự Án — eFORM.VJU (eDRL)

> Tài liệu này mô tả cấu trúc thư mục **thực tế** của dự án eFORM.VJU làm chuẩn tham chiếu.  
> Mọi dự án tương tự (fullstack Spring Boot + React) đều học theo cấu trúc này.

---

## 📑 Mục lục

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Cấu trúc Monorepo gốc](#2-cấu-trúc-monorepo-gốc)
3. [Backend — Spring Boot](#3-backend--spring-boot)
4. [Frontend — React + Vite](#4-frontend--react--vite)
5. [Quy ước đặt tên](#5-quy-ước-đặt-tên)
6. [Checklist dự án mới](#6-checklist-dự-án-mới)

---

## 1. Tổng quan dự án

| Thông tin       | Chi tiết                                      |
|-----------------|-----------------------------------------------|
| **Tên**         | eFORM.VJU — Hệ thống ĐRL điện tử VJU         |
| **Backend**     | Spring Boot (Java), Maven, PostgreSQL, Flyway |
| **Frontend**    | React + Vite + TypeScript, Zustand, shadcn/ui |
| **Deploy**      | Docker, Vercel (FE)                           |
| **Kiến trúc**   | Monorepo: `backend-springboot/` + `frontend-react/` |

---

## 2. Cấu trúc Monorepo gốc

```
eFORM.VJU/                          ← Root monorepo
│
├── backend-springboot/             ← Spring Boot API
├── frontend-react/                 ← React + Vite SPA
│
├── database/                       ← SQL scripts, ERD, seed data
├── docs/                           ← Tài liệu kỹ thuật
├── documents/                      ← Tài liệu nghiệp vụ, phân tích
├── scripts/                        ← Scripts tự động hoá (deploy, backup...)
├── tools/                          ← Tools phụ trợ (vd: word-parser)
│   └── word-parser/
│
├── .github/                        ← GitHub Actions, CI/CD workflows
├── .env.example                    ← Template biến môi trường toàn stack
├── .dockerignore
├── .gitignore
├── README_DOCKER.md                ← Hướng dẫn chạy bằng Docker
├── URD.md                          ← User Requirements Document
└── TEMPLATE_USER_GUIDE.md
```

---

## 3. Backend — Spring Boot

### 3.1 Cấu trúc thư mục

```
backend-springboot/
│
├── src/
│   ├── main/
│   │   ├── java/vn/edu/drl/backend/        ← Package gốc
│   │   │   │
│   │   │   ├── BackendSpringbootApplication.java   ← Entry point (@SpringBootApplication)
│   │   │   │
│   │   │   ├── controller/                 ← REST Controllers (API Layer)
│   │   │   │  
│   │   │   │
│   │   │   ├── service/                    ← Business Logic Layer
│   │   │   │   ├── impl/                   ← Implementations của service interfaces
│   │   │   │   └── interface/                 ← Interface của services
│   │   │   │
│   │   │   ├── dao/                        ← Data Access Layer (Spring Data JPA Repositories)
│   │   │   │ 
│   │   │   │
│   │   │   ├── hibernateDao/               ← Hibernate native queries phức tạp
│   │   │   │
│   │   │   ├── model/                      ← JPA Entities (ánh xạ bảng DB)
│   │   │   │
│   │   │   ├── dto/                        ← Data Transfer Objects
│   │   │   │   ├── request/                ← Request payloads từ client
│   │   │   │   │   
│   │   │   │   └── response/               ← Response trả về client
│   │   │   │       
│   │   │   │
│   │   │   ├── Wrapper/                    ← Generic response wrappers
│   │   │   │   ├── ApiResponse.java        ← Bọc tất cả response: {success, message, data}
│   │   │   │   └── PageWrapper.java        ← Bọc kết quả phân trang
│   │   │   │
│   │   │   ├── security/                   ← Spring Security, JWT config
│   │   │   ├── config/                     ← Bean configurations
│   │   │   │   └── RestTemplateConfig.java
│   │   │   ├── exception/                  ← Custom exceptions
│   │   │   └── enu/                        ← Enums (tên thư mục viết tắt của enum)
│   │   │       ├── EvaluationPeriodStatus.java
│   │   │       └── FieldDataType.java
│   │   │
│   │   └── resources/
│   │       ├── application.yml             ← Cấu hình chính (profile: prod)
│   │       ├── application-demo.yml        ← Cấu hình demo/staging
│   │       └── db/migration/               ← Flyway migrations (versioned SQL)
│   │           
│   │
│   └── test/                               ← Test cases (JUnit)
│
├── Dockerfile                              ← Build image production
├── pom.xml                                 ← Maven dependencies & build config
└── target/                                 ← Build output (gitignored)
```

### 3.2 Luồng xử lý request (Backend)

```
HTTP Request
    ↓
controller/          ← Nhận request, validate basic, gọi service
    ↓
service/impl/        ← Business logic, orchestration
    ↓
dao/ hoặc            ← Truy vấn DB qua JPA / Hibernate
hibernateDao/
    ↓
model/               ← JPA Entity ↔ Database Table
    ↓
dto/response/        ← Map Entity → Response DTO
    ↓
Wrapper/ApiResponse  ← Đóng gói {success, message, data}
    ↓
HTTP Response
```

### 3.3 Quy tắc vàng Backend (Spring Boot)

> **Rule #1 — Controller chỉ làm 3 việc:**  
> Parse request → Gọi service → Return `ApiResponse.success(data)`  
> **Không đặt business logic trong controller.**

> **Rule #2 — Mỗi migration file là vĩnh viễn**  
> File `Vn__*.sql` đã commit thì **không bao giờ sửa**.  
> Thêm thay đổi DB = tạo file migration mới với số version tăng dần.

> **Rule #3 — DTO tách biệt hoàn toàn với Entity**  
> Không trả Entity thẳng ra API. Luôn map sang DTO trong `dto/response/`.

---

## 4. Frontend — React + Vite

### 4.1 Cấu trúc thư mục

```
frontend-react/
│
├── src/
│   │
│   ├── main.tsx                    ← Entry point React (render <App/>)
│   ├── App.tsx                     ← Root component: setup Router, Providers
│   ├── vite-env.d.ts               ← Vite type declarations
│   │
│   ├── pages/                      ← Trang theo từng ROLE người dùng
│   │   
│   │
│   ├── components/                 ← UI Components dùng chung
│   │   ├── ui/                     ← Atomic UI (shadcn/ui components)
│   │   │                           ← Button, Input, Modal, Table, Badge...
│   │   ├── layout/                 ← Layout tổng thể
│   │   │                           ← Header, Sidebar, MainLayout...
│   │   
│   │   ├── signature/              ← Component chữ ký số
│   │   └── split-screen/           ← Layout split screen (xem form + phê duyệt)
│   │
│   ├── services/                   ← Gọi API (axios calls, map request/response)
│   │   │                           ← Mỗi file tương ứng với 1 domain/controller
│   │   └── *.service.ts
│   │
│   ├── stores/                     ← Global state management (Zustand)
│   │   └── *.store.ts              ← auth.store, notification.store...
│   │
│   ├── lib/                        ← Thư viện/utilities cấu hình sẵn
│   │   └── axios/                  ← Axios instance với interceptors (auth header, error)
│   │
│   └── common/                     ← Hằng số và config dùng chung
│       ├── constants/              ← API endpoints, app constants
│       └── permission-config/      ← Role-based permission mappings
│
├── public/                         ← Static files (favicon, logo...)
├── dist/                           ← Build output (gitignored)
│
├── index.html                      ← HTML entry point (Vite)
├── vite.config.ts                  ← Vite build configuration
├── tailwind.config.js              ← Tailwind CSS configuration
├── tsconfig.json                   ← TypeScript configuration
├── package.json                    ← Dependencies & scripts
└── .vercel/                        ← Vercel deploy config
```



>  **Lý do chọn pattern này:** Dự án có flow nghiệp vụ rõ ràng theo role.  
> Mỗi role có màn hình và quyền khác nhau hoàn toàn → tách riêng dễ maintain.

### 4.2 Quy tắc vàng Frontend (React)

> **Rule #1 — Trang mới = thêm vào đúng thư mục role**  
> Tính năng cho admin → vào `pages/admin/ten-tinh-nang/`  
> Tính năng cho sinh viên → vào `pages/student/`

> **Rule #2 — Component tái sử dụng mới vào `components/`**  
> Nếu component dùng ở 2+ trang khác role → đưa vào `components/`.  
> Nếu chỉ dùng trong 1 trang → đặt thẳng trong thư mục trang đó.

> **Rule #3 — Mọi gọi API qua `services/`**  
> Không gọi axios trực tiếp trong component.  
> Tạo function trong `services/` rồi gọi từ component/store.

---

## 5. Quy ước đặt tên

### Backend (Java — Spring Boot)

| Loại              | Convention    | Ví dụ                              |
|-------------------|---------------|------------------------------------|
| Class             | `PascalCase`  | `UserController`, `AuthService`    |
| Method            | `camelCase`   | `getUserById()`, `submitForm()`    |
| Variable          | `camelCase`   | `currentUser`, `evaluationPeriod`  |
| Constant          | `UPPER_SNAKE` | `MAX_FILE_SIZE`, `JWT_EXPIRY`      |
| File Java         | `PascalCase`  | `UserController.java`              |
| Package           | `lowercase`   | `vn.edu.drl.backend.controller`    |
| DTO Request       | `XxxRequest`  | `LoginRequest`, `SubmitFormRequest`|
| DTO Response      | `XxxResponse` | `AuthResponse`, `UserResponse`     |
| Entity/Model      | tên thực thể  | `User`, `ScoreForm`, `FieldMaster` |
| Repository (DAO)  | `XxxRepository` | `UserRepository`                 |

### Frontend (TypeScript — React)

| Loại              | Convention    | Ví dụ                              |
|-------------------|---------------|------------------------------------|
| Component         | `PascalCase`  | `LoginForm`, `ScoreFormViewer`     |
| File component    | `PascalCase`  | `LoginForm.tsx`                    |
| File non-component| `kebab-case`  | `auth.service.ts`, `use-auth.ts`   |
| Thư mục           | `kebab-case`  | `form-builder/`, `class-leader/`   |
| Zustand store     | `camelCase`   | `useAuthStore`, `useNotificationStore` |
| Service function  | `camelCase`   | `submitForm()`, `getEvaluationPeriods()` |
| Constant          | `UPPER_SNAKE` | `API_BASE_URL`, `ROLES`            |

### Commit Message (Conventional Commits)

```
feat(auth): thêm xác thực JWT refresh token
fix(form): sửa lỗi không lưu draft khi timeout
refactor(controller): tách AdminApproval thành service riêng
docs: cập nhật ERD và mô tả API
chore(deps): nâng cấp Spring Boot lên 3.3.0
test(service): thêm unit test cho WorkflowService
migration: thêm V9__Add_notification_settings.sql
```

---

## 6. Checklist dự án mới 

### Khởi tạo Monorepo
- [ ] Tạo root folder với tên dự án
- [ ] Tạo 2 subfolder: `backend-xxx/` và `frontend-xxx/`
- [ ] Tạo `database/`, `docs/`, `scripts/`
- [ ] Tạo `.env.example` ở root với tất cả biến cần thiết
- [ ] Tạo `README_DOCKER.md` hướng dẫn chạy Docker

### Backend (Spring Boot)
- [ ] Khởi tạo project qua [Spring Initializr](https://start.spring.io/) với: Web, JPA, Security, Flyway, PostgreSQL
- [ ] Tạo package structure: `controller/`, `service/impl/`, `dao/`, `model/`, `dto/request/`, `dto/response/`, `security/`, `config/`, `exception/`, `enu/`
- [ ] Tạo `Wrapper/ApiResponse.java` để chuẩn hoá response format
- [ ] Tạo `GlobalExceptionHandler.java` với `@ControllerAdvice`
- [ ] Tạo file migration đầu tiên: `V1__Init_schema.sql`
- [ ] Cấu hình `application.yml` và `application-{profile}.yml`
- [ ] Tạo `Dockerfile`

### Frontend (React + Vite)
- [ ] Khởi tạo: `npm create vite@latest frontend-xxx -- --template react-ts`
- [ ] Cài dependencies: `tailwindcss`, `shadcn/ui`, `zustand`, `axios`, `react-router-dom`
- [ ] Tạo folder structure: `pages/`, `components/ui/`, `components/layout/`, `services/`, `stores/`, `lib/axios/`, `common/`
- [ ] Tạo `lib/axios/index.ts` với interceptors (auth header, 401 handler)
- [ ] Tạo `common/constants/` với API endpoints và app constants
- [ ] Tạo `common/permission-config/` với role-based routes

### Xác nhận
- [ ] Backend chạy được: `mvn spring-boot:run`
- [ ] Frontend chạy được: `npm run dev`
- [ ] Hai bên kết nối được (test 1 API đơn giản)
- [ ] `docker-compose up` chạy thành công cả stack

---

