-- V12__Add_performance_indexes.sql
-- Tối ưu hóa hiệu năng truy vấn cho E-Form DRL VJU

-- 1. Index cho bảng signature_logs (tránh full table scan khi xem chi tiết phiếu hoặc tra cứu chữ ký)
CREATE INDEX IF NOT EXISTS idx_signature_logs_score_form_id ON signature_logs(score_form_id);
CREATE INDEX IF NOT EXISTS idx_signature_logs_signer_id ON signature_logs(signer_id);

-- 2. Index cho bảng audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_score_form_id ON audit_logs(score_form_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_eval_period_id ON audit_logs(evaluation_period_id);

-- 3. Index cho bảng score_forms
CREATE INDEX IF NOT EXISTS idx_score_forms_form_version_id ON score_forms(form_version_id);
CREATE INDEX IF NOT EXISTS idx_score_forms_student_status ON score_forms(student_id, status);
CREATE INDEX IF NOT EXISTS idx_score_forms_status ON score_forms(status);

-- 4. Index cho bảng score_form_details
CREATE INDEX IF NOT EXISTS idx_score_form_details_form_id ON score_form_details(score_form_id);
CREATE INDEX IF NOT EXISTS idx_score_form_details_criteria_id ON score_form_details(criteria_id);

-- 5. Index cho bảng notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications(user_id, is_read, created_at DESC);

-- 6. Index cho bảng evaluation_periods
CREATE INDEX IF NOT EXISTS idx_eval_periods_status_created ON evaluation_periods(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_eval_periods_semester_status ON evaluation_periods(semester_id, status);
