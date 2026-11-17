-- V13__Add_first_login_flags_to_users.sql
-- Thêm cờ đánh dấu đăng nhập lần đầu bằng mật khẩu hệ thống cấp (UC-AUTH-02)

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;

UPDATE users SET is_first_login = FALSE WHERE is_first_login IS NULL;
UPDATE users SET must_change_password = FALSE WHERE must_change_password IS NULL;
