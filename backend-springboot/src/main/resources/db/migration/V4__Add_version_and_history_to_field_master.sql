-- 1. Add version and updated_at to field_master
ALTER TABLE field_master ADD COLUMN IF NOT EXISTS version VARCHAR(20) DEFAULT '1.0';
ALTER TABLE field_master ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to have 1.0 and updated_at
UPDATE field_master SET version = '1.0' WHERE version IS NULL;
UPDATE field_master SET updated_at = COALESCE(created_at, CURRENT_TIMESTAMP) WHERE updated_at IS NULL;

-- 2. Create field_master_history table
CREATE TABLE IF NOT EXISTS field_master_history (
    id BIGSERIAL PRIMARY KEY,
    field_id BIGINT REFERENCES field_master(id) ON DELETE CASCADE,
    version VARCHAR(20) NOT NULL,
    field_code VARCHAR(100) NOT NULL,
    field_name VARCHAR(255) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    is_required BOOLEAN DEFAULT FALSE,
    min_value NUMERIC(10, 2),
    max_value NUMERIC(10, 2),
    regex_pattern VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_field_master_history_field_id ON field_master_history(field_id);

-- 3. Backfill initial history for existing field_master records
INSERT INTO field_master_history (field_id, version, field_code, field_name, data_type, category, is_required, min_value, max_value, regex_pattern, description, is_active, created_at)
SELECT id, COALESCE(version, '1.0'), field_code, field_name, data_type, category, is_required, min_value, max_value, regex_pattern, description, is_active, COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
FROM field_master
WHERE id NOT IN (SELECT DISTINCT field_id FROM field_master_history WHERE field_id IS NOT NULL);
