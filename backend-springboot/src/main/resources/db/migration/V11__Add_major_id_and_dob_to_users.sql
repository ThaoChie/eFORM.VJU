ALTER TABLE users ADD COLUMN IF NOT EXISTS major_id BIGINT REFERENCES majors(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dob DATE;
CREATE INDEX IF NOT EXISTS idx_users_major_id ON users(major_id);

-- Backfill major_id from class if class has major_id
UPDATE users u
SET major_id = c.major_id
FROM classes c
WHERE u.class_id = c.id AND c.major_id IS NOT NULL AND u.major_id IS NULL;

-- Backfill major_id from department if matching major exists
UPDATE users u
SET major_id = m.id
FROM majors m
WHERE u.major_id IS NULL AND u.dept_id = m.dept_id;
