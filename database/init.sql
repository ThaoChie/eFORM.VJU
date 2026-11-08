-- ====================================================================
-- HỆ THỐNG E-FORM ĐIỂM RÈN LUYỆN ĐẠI HỌC - DATABASE INITIALIZATION
-- ====================================================================

-- 1. Bảng Người dùng (Phân quyền 4 vai trò)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    "userID" VARCHAR(50) UNIQUE NOT NULL, -- Mã SV hoặc Mã Cán bộ
    "fullName" VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('STUDENT', 'CLASS_LEADER', 'DEAN', 'ADMIN')),
    "className" VARCHAR(50), -- Lớp sinh hoạt (VD: D21CQCN01-B)
    "facultyName" VARCHAR(100) NOT NULL, -- Khoa quản lý (VD: Công nghệ Thông tin)
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Học kỳ đánh giá
CREATE TABLE IF NOT EXISTS semesters (
    id SERIAL PRIMARY KEY,
    "semesterCode" VARCHAR(20) UNIQUE NOT NULL, -- VD: HK1_2025_2026
    "semesterName" VARCHAR(100) NOT NULL,
    "academicYear" VARCHAR(20) NOT NULL,
    "isActive" BOOLEAN DEFAULT TRUE,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL
);

-- 3. Bảng Khung Tiêu chí ĐRL (Form Động)
CREATE TABLE IF NOT EXISTS criteria (
    id SERIAL PRIMARY KEY,
    "semesterId" INT REFERENCES semesters(id) ON DELETE CASCADE,
    "criteriaCode" VARCHAR(20) NOT NULL, -- VD: TC1_1, TC2_3
    title TEXT NOT NULL,
    category VARCHAR(100) NOT NULL, -- VD: Ý thức học tập, Hoạt động phong trào...
    "maxScore" INT NOT NULL,
    "requiresProof" BOOLEAN DEFAULT FALSE, -- Bắt buộc upload minh chứng
    "orderIndex" INT DEFAULT 0
);

-- 4. Bảng Phiếu Điểm Rèn Luyện (Score Form Master)
CREATE TABLE IF NOT EXISTS score_forms (
    id SERIAL PRIMARY KEY,
    "studentId" INT REFERENCES users(id) ON DELETE CASCADE,
    "semesterId" INT REFERENCES semesters(id) ON DELETE CASCADE,
    status VARCHAR(30) DEFAULT 'DRAFT' 
        CHECK (status IN ('DRAFT', 'SUBMITTED', 'CLASS_APPROVED', 'DEAN_APPROVED', 'REJECTED')),
    "studentTotal" INT DEFAULT 0,
    "classTotal" INT DEFAULT 0,
    "finalTotal" INT DEFAULT 0,
    ranking VARCHAR(30), -- Xuất sắc, Tốt, Khá, Trung bình, Yếu, Kém
    "rejectReason" TEXT, -- Lý do nếu bị chuyển trả
    "pdfFileUrl" TEXT, -- Đường dẫn file PDF hoàn chỉnh đã ký
    "pdfHashSha256" VARCHAR(64), -- Băm SHA-256 của file PDF chống giả mạo
    "isLocked" BOOLEAN DEFAULT FALSE, -- Khóa sửa đổi sau khi Khoa duyệt
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("studentId", "semesterId")
);

-- 5. Bảng Chi tiết Điểm từng Tiêu chí (Kèm Link Minh chứng)
CREATE TABLE IF NOT EXISTS score_form_details (
    id SERIAL PRIMARY KEY,
    "scoreFormId" INT REFERENCES score_forms(id) ON DELETE CASCADE,
    "criteriaId" INT REFERENCES criteria(id) ON DELETE CASCADE,
    "studentScore" INT DEFAULT 0,
    "classScore" INT DEFAULT 0,
    "proofUrl" TEXT, -- URL ảnh/PDF minh chứng
    note TEXT
);

-- 6. Bảng Nhật ký Ký số (Lưu chữ ký 3 cấp)
CREATE TABLE IF NOT EXISTS signature_logs (
    id SERIAL PRIMARY KEY,
    "scoreFormId" INT REFERENCES score_forms(id) ON DELETE CASCADE,
    "signerId" INT REFERENCES users(id) ON DELETE CASCADE,
    "signerRole" VARCHAR(20) NOT NULL CHECK ("signerRole" IN ('STUDENT', 'CLASS_LEADER', 'DEAN')),
    "signOrder" INT NOT NULL, -- 1: SV ký, 2: Lớp trưởng ký, 3: Trưởng khoa ký
    "signatureImgUrl" TEXT NOT NULL, -- Ảnh nét ký tay từ HTML5 Canvas
    "sha256Hash" VARCHAR(64) NOT NULL, -- Mã băm dữ liệu tại thời điểm ký
    "signedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" VARCHAR(50)
);

-- 7. Bảng Nhật ký Kiểm toán (Audit Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    "scoreFormId" INT REFERENCES score_forms(id) ON DELETE CASCADE,
    "userId" INT REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- CREATE, SUBMIT, CLASS_APPROVE, DEAN_APPROVE, REJECT
    "fromStatus" VARCHAR(30),
    "toStatus" VARCHAR(30),
    note TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo Index tăng tốc độ truy vấn
CREATE INDEX IF NOT EXISTS idx_score_forms_student ON score_forms("studentId");
CREATE INDEX IF NOT EXISTS idx_score_forms_semester ON score_forms("semesterId");
CREATE INDEX IF NOT EXISTS idx_score_forms_status ON score_forms(status);
CREATE INDEX IF NOT EXISTS idx_users_class ON users("className");
CREATE INDEX IF NOT EXISTS idx_users_faculty ON users("facultyName");
CREATE INDEX IF NOT EXISTS idx_score_form_details_form ON score_form_details("scoreFormId");
CREATE INDEX IF NOT EXISTS idx_signature_logs_form ON signature_logs("scoreFormId");

-- ====================================================================
-- SEED DATA (DỮ LIỆU MẪU BAN ĐẦU)
-- ====================================================================

-- Mật khẩu mặc định cho tất cả tài khoản mẫu là: password123
-- Hash bcrypt 10 rounds: $2a$10$wEkgzW4p3Gsm2FwR1FbvauZk7qI8U6y9bIq15kK9wQ7H0T1H6P.3u
INSERT INTO users ("userID", "fullName", email, "passwordHash", role, "className", "facultyName")
VALUES 
('ADMIN01', 'Quản trị viên Hệ thống', 'admin@drl.edu.vn', '$2a$10$wEkgzW4p3Gsm2FwR1FbvauZk7qI8U6y9bIq15kK9wQ7H0T1H6P.3u', 'ADMIN', NULL, 'Phòng Đào tạo'),
('DEAN_CNTT', 'PGS.TS Trần Văn Hùng (Trưởng Khoa)', 'dean.cntt@drl.edu.vn', '$2a$10$wEkgzW4p3Gsm2FwR1FbvauZk7qI8U6y9bIq15kK9wQ7H0T1H6P.3u', 'DEAN', NULL, 'Công nghệ Thông tin'),
('BCS_D21CQCN01', 'Lê Hoàng Nam (Lớp trưởng D21CQCN01)', 'nam.le@student.drl.edu.vn', '$2a$10$wEkgzW4p3Gsm2FwR1FbvauZk7qI8U6y9bIq15kK9wQ7H0T1H6P.3u', 'CLASS_LEADER', 'D21CQCN01-B', 'Công nghệ Thông tin'),
('B21DCCN001', 'Nguyễn Minh Trí', 'tri.nguyen@student.drl.edu.vn', '$2a$10$wEkgzW4p3Gsm2FwR1FbvauZk7qI8U6y9bIq15kK9wQ7H0T1H6P.3u', 'STUDENT', 'D21CQCN01-B', 'Công nghệ Thông tin'),
('B21DCCN002', 'Phạm Quỳnh Anh', 'anh.pham@student.drl.edu.vn', '$2a$10$wEkgzW4p3Gsm2FwR1FbvauZk7qI8U6y9bIq15kK9wQ7H0T1H6P.3u', 'STUDENT', 'D21CQCN01-B', 'Công nghệ Thông tin')
ON CONFLICT ("userID") DO NOTHING;

-- Khởi tạo Học kỳ mẫu
INSERT INTO semesters ("semesterCode", "semesterName", "academicYear", "isActive", "startDate", "endDate")
VALUES 
('HK1_2025_2026', 'Học kỳ 1 Năm học 2025-2026', '2025-2026', TRUE, '2025-09-01', '2026-01-15')
ON CONFLICT ("semesterCode") DO NOTHING;

-- Khởi tạo Khung Tiêu chí ĐRL chuẩn (5 Nhóm Tiêu chí quy chuẩn)
INSERT INTO criteria ("semesterId", "criteriaCode", title, category, "maxScore", "requiresProof", "orderIndex")
SELECT s.id, c.code, c.title, c.category, c.max_score, c.req_proof, c.idx
FROM semesters s
CROSS JOIN (
    VALUES
    ('TC1_1', 'Ý thức học tập trên lớp, đi học đầy đủ, đúng giờ', '1. Ý thức tham gia học tập', 10, FALSE, 1),
    ('TC1_2', 'Tham gia các câu lạc bộ học thuật, NCKH, thi Olympic', '1. Ý thức tham gia học tập', 10, TRUE, 2),
    ('TC2_1', 'Chấp hành nghiêm chỉnh nội quy, quy chế nhà trường', '2. Ý thức chấp hành quy chế', 15, FALSE, 3),
    ('TC2_2', 'Tham gia đầy đủ các buổi sinh hoạt lớp, tuần sinh hoạt công dân', '2. Ý thức chấp hành quy chế', 10, FALSE, 4),
    ('TC3_1', 'Tham gia hoạt động tình nguyện, chiến dịch mùa hè xanh, hiến máu', '3. Ý thức tham gia hoạt động chính trị - xã hội', 15, TRUE, 5),
    ('TC3_2', 'Tham gia các hoạt động văn hóa, văn nghệ, thể dục thể thao cấp trường/khoa', '3. Ý thức tham gia hoạt động chính trị - xã hội', 10, TRUE, 6),
    ('TC4_1', 'Có tinh thần đoàn kết, giúp đỡ bạn bè trong học tập và sinh hoạt', '4. Phẩm chất công dân và quan hệ cộng đồng', 15, FALSE, 7),
    ('TC4_2', 'Tích cực tham gia tuyên truyền phòng chống tệ nạn xã hội', '4. Phẩm chất công dân và quan hệ cộng đồng', 10, FALSE, 8),
    ('TC5_1', 'Đảm nhiệm và hoàn thành tốt nhiệm vụ Ban cán sự Lớp, Đoàn - Hội', '5. Ý thức tham gia phụ trách lớp, đoàn thể', 10, TRUE, 9),
    ('TC5_2', 'Được khen thưởng các cấp trong học kỳ', '5. Ý thức tham gia phụ trách lớp, đoàn thể', 5, TRUE, 10)
) AS c(code, title, category, max_score, req_proof, idx)
WHERE s."semesterCode" = 'HK1_2025_2026'
ON CONFLICT DO NOTHING;
