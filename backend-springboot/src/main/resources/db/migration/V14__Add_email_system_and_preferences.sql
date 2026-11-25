-- V14__Add_email_system_and_preferences.sql
-- Thêm cấu hình nhận thông báo email và bảng phục vụ luồng gửi email Brevo

-- 1. Thêm cấu hình tùy chọn email vào bảng users
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_reminders_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_class_updates_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signature_unlocked_until TIMESTAMP WITH TIME ZONE;

UPDATE users SET email_reminders_enabled = TRUE WHERE email_reminders_enabled IS NULL;
UPDATE users SET email_class_updates_enabled = TRUE WHERE email_class_updates_enabled IS NULL;

-- 2. Bảng mã đặt lại mật khẩu (Luồng 1.2)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(120) NOT NULL UNIQUE,
    otp VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pw_reset_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_pw_reset_user ON password_reset_tokens(user_id);

-- 3. Bảng nhật ký email đã gửi (Email Queue & Audit Log)
CREATE TABLE IF NOT EXISTS email_logs (
    id BIGSERIAL PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    template_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    brevo_message_id VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_template ON email_logs(template_type);
