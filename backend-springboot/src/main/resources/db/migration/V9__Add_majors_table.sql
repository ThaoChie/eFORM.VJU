CREATE TABLE IF NOT EXISTS majors (
    id BIGSERIAL PRIMARY KEY,
    major_code VARCHAR(50) UNIQUE NOT NULL,
    major_name VARCHAR(255) NOT NULL,
    dept_id BIGINT REFERENCES departments(id) ON DELETE SET NULL,
    status INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_majors_dept_id ON majors(dept_id);

-- Seed initial default major for CNTT if CNTT department exists
INSERT INTO majors (major_code, major_name, dept_id, status)
SELECT 'CNTT', 'Công nghệ Thông tin', id, 1
FROM departments
WHERE dept_code = 'CNTT'
ON CONFLICT (major_code) DO NOTHING;
