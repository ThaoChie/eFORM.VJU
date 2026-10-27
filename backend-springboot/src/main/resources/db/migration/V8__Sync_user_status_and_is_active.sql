-- V6__Sync_user_status_and_is_active.sql
-- Đồng bộ trường status (0 = Vô hiệu hóa) và is_active (false = Vô hiệu hóa)

UPDATE users SET is_active = false WHERE status = 0;
UPDATE users SET status = 0 WHERE is_active = false;
