-- V7__Add_signature_lock_and_hash_to_users.sql
-- Add signature security columns to users table: SHA-256 hash, registration timestamp, and immutable lock flag

ALTER TABLE users ADD COLUMN IF NOT EXISTS signature_hash VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS signature_registered_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_signature_locked BOOLEAN DEFAULT FALSE;

-- Reset any test/demo signature from student users so every student must upload their own unique signature
UPDATE users 
SET signature_specimen_url = NULL, 
    signature_hash = NULL, 
    signature_registered_at = NULL, 
    is_signature_locked = FALSE 
WHERE role = 'STUDENT';
