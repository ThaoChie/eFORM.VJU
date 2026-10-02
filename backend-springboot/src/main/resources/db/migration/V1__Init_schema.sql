-- 1. departments
CREATE TABLE departments (
    id BIGSERIAL PRIMARY KEY,
    dept_code VARCHAR(50) UNIQUE NOT NULL,
    dept_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. classes
CREATE TABLE classes (
    id BIGSERIAL PRIMARY KEY,
    class_code VARCHAR(50) UNIQUE NOT NULL,
    class_name VARCHAR(255) NOT NULL,
    dept_id BIGINT REFERENCES departments(id),
    academic_cohort VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. users
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    user_code VARCHAR(50) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- STUDENT, CLASS_LEADER, DEAN, ADMIN
    position_title VARCHAR(100),
    dept_id BIGINT REFERENCES departments(id),
    class_id BIGINT REFERENCES classes(id),
    academic_cohort VARCHAR(50),
    is_signer BOOLEAN DEFAULT FALSE,
    signature_specimen_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_users_class_role ON users(class_id, role);
CREATE INDEX idx_users_dept_role ON users(dept_id, role);

-- 4. semesters
CREATE TABLE semesters (
    id BIGSERIAL PRIMARY KEY,
    semester_code VARCHAR(50) UNIQUE NOT NULL,
    semester_name VARCHAR(255) NOT NULL,
    academic_year VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    start_date DATE,
    end_date DATE
);

-- 5. field_master
CREATE TABLE field_master (
    id BIGSERIAL PRIMARY KEY,
    field_code VARCHAR(100) UNIQUE NOT NULL, -- snake_case
    field_name VARCHAR(255) NOT NULL,
    data_type VARCHAR(50) NOT NULL, -- STRING, NUMBER, DATE, BOOLEAN, ARRAY, FILE, SIGNATURE
    category VARCHAR(100),
    is_required BOOLEAN DEFAULT FALSE,
    min_value NUMERIC(10, 2),
    max_value NUMERIC(10, 2),
    regex_pattern VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. form_versions
CREATE TABLE form_versions (
    id BIGSERIAL PRIMARY KEY,
    form_code VARCHAR(50) NOT NULL,
    form_name VARCHAR(255) NOT NULL,
    version_no VARCHAR(20) NOT NULL,
    semester_id BIGINT REFERENCES semesters(id),
    template_layout_json JSONB,
    status VARCHAR(50) NOT NULL, -- DRAFT, ACTIVE, INACTIVE
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (form_code, version_no)
);

-- 7. criteria
CREATE TABLE criteria (
    id BIGSERIAL PRIMARY KEY,
    semester_id BIGINT REFERENCES semesters(id),
    field_id BIGINT REFERENCES field_master(id),
    criteria_code VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    category VARCHAR(100),
    max_score NUMERIC(10, 2) NOT NULL,
    requires_proof BOOLEAN DEFAULT FALSE,
    order_index INT DEFAULT 0
);
CREATE INDEX idx_criteria_sem_order ON criteria(semester_id, order_index);

-- 8. score_forms
CREATE TABLE score_forms (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES users(id),
    semester_id BIGINT REFERENCES semesters(id),
    form_version_id BIGINT REFERENCES form_versions(id),
    status VARCHAR(50) NOT NULL, -- DRAFT, SUBMITTED, CLASS_APPROVED, DEAN_APPROVED, REJECTED
    student_total NUMERIC(10, 2),
    class_total NUMERIC(10, 2),
    final_total NUMERIC(10, 2),
    ranking VARCHAR(50),
    reject_reason TEXT,
    pdf_file_url TEXT,
    pdf_hash_sha256 VARCHAR(255),
    is_locked BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0, -- For optimistic locking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, semester_id)
);
CREATE INDEX idx_score_forms_sem_status ON score_forms(semester_id, status);
CREATE INDEX idx_score_forms_student ON score_forms(student_id);

-- 9. score_form_details
CREATE TABLE score_form_details (
    id BIGSERIAL PRIMARY KEY,
    score_form_id BIGINT REFERENCES score_forms(id),
    criteria_id BIGINT REFERENCES criteria(id),
    student_score NUMERIC(10, 2),
    class_score NUMERIC(10, 2),
    proof_url TEXT,
    note TEXT,
    UNIQUE(score_form_id, criteria_id)
);

-- 10. signature_logs
CREATE TABLE signature_logs (
    id BIGSERIAL PRIMARY KEY,
    score_form_id BIGINT REFERENCES score_forms(id),
    signer_id BIGINT REFERENCES users(id),
    signer_role VARCHAR(50),
    sign_order INT, -- 1=STUDENT, 2=CLASS_LEADER, 3=DEAN
    signature_img_url TEXT,
    sha256_hash VARCHAR(255),
    signed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address VARCHAR(50),
    is_revoked BOOLEAN DEFAULT FALSE
);

-- 11. notifications
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    type VARCHAR(50), -- SYSTEM, REJECT, APPROVE, REMINDER, SUBMIT
    link_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- 12. audit_logs
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    score_form_id BIGINT REFERENCES score_forms(id),
    user_id BIGINT REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
