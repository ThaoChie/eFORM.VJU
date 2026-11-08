-- V6__Add_evaluation_periods_table.sql
-- Table for managing Evaluation Periods (UC018 - Quản lý kỳ chấm ĐRL)

CREATE TABLE IF NOT EXISTS evaluation_periods (
    id BIGSERIAL PRIMARY KEY,
    semester_id BIGINT NOT NULL REFERENCES semesters(id),
    form_version_id BIGINT NOT NULL REFERENCES form_versions(id),
    application_scope VARCHAR(100) NOT NULL,
    submission_deadline DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'CHUA_MO', -- CHUA_MO, DANG_MO, DA_DONG
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eval_periods_status ON evaluation_periods(status);
CREATE INDEX IF NOT EXISTS idx_eval_periods_sem_scope ON evaluation_periods(semester_id, application_scope);

-- Add period_id to audit_logs for tracking changes to evaluation periods
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'period_id'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN period_id BIGINT REFERENCES evaluation_periods(id);
        CREATE INDEX idx_audit_logs_period ON audit_logs(period_id);
    END IF;
END $$;

-- Seed initial evaluation period for HK2_2026_2027 (Active)
INSERT INTO evaluation_periods (id, semester_id, form_version_id, application_scope, submission_deadline, status, created_by)
SELECT 1, 2, 1, 'Toàn trường', '2027-05-31', 'DANG_MO', 1
WHERE EXISTS (SELECT 1 FROM semesters WHERE id = 2) 
  AND EXISTS (SELECT 1 FROM form_versions WHERE id = 1)
ON CONFLICT (id) DO NOTHING;

SELECT setval('evaluation_periods_id_seq', (SELECT COALESCE(MAX(id), 1) FROM evaluation_periods));

-- Seed audit log for initial period
INSERT INTO audit_logs (period_id, user_id, action, from_status, to_status, note)
SELECT 1, 1, 'OPEN_PERIOD', 'CHUA_MO', 'DANG_MO', 'Khởi tạo và mở kỳ chấm ĐRL Học kỳ 2 Năm học 2026-2027'
WHERE EXISTS (SELECT 1 FROM evaluation_periods WHERE id = 1)
  AND NOT EXISTS (SELECT 1 FROM audit_logs WHERE period_id = 1 AND action = 'OPEN_PERIOD');
