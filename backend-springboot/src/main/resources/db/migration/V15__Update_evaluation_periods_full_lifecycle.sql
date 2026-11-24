-- V15__Update_evaluation_periods_full_lifecycle.sql
-- Hoàn thiện vòng đời toàn trình Quản lý Kỳ chấm ĐRL (UC-ADM-05, BR-KCDRL-01 -> BR-KCDRL-07)

ALTER TABLE evaluation_periods ADD COLUMN IF NOT EXISTS period_code VARCHAR(100);
ALTER TABLE evaluation_periods ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE evaluation_periods ADD COLUMN IF NOT EXISTS student_deadline DATE;
ALTER TABLE evaluation_periods ADD COLUMN IF NOT EXISTS class_deadline DATE;
ALTER TABLE evaluation_periods ADD COLUMN IF NOT EXISTS dean_deadline DATE;
ALTER TABLE evaluation_periods ADD COLUMN IF NOT EXISTS applicable_departments TEXT;
ALTER TABLE evaluation_periods ADD COLUMN IF NOT EXISTS exceptions TEXT;
ALTER TABLE evaluation_periods ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;

-- Cập nhật dữ liệu cho các bản ghi hiện có
UPDATE evaluation_periods 
SET 
  period_code = COALESCE(period_code, 'HK' || semester_id || '_PERIOD_' || id),
  start_date = COALESCE(start_date, (created_at::DATE)),
  student_deadline = COALESCE(student_deadline, submission_deadline),
  class_deadline = COALESCE(class_deadline, (submission_deadline + 7)),
  dean_deadline = COALESCE(dean_deadline, (submission_deadline + 14)),
  is_locked = COALESCE(is_locked, FALSE)
WHERE period_code IS NULL OR student_deadline IS NULL;

-- Đảm bảo period_code là duy nhất
CREATE UNIQUE INDEX IF NOT EXISTS uq_eval_periods_period_code ON evaluation_periods(period_code);
