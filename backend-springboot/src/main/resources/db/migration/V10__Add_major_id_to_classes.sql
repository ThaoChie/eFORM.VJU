ALTER TABLE classes ADD COLUMN IF NOT EXISTS major_id BIGINT REFERENCES majors(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_classes_major_id ON classes(major_id);

-- Backfill major_id for existing classes based on dept_id if matching major exists
UPDATE classes c
SET major_id = m.id
FROM majors m
WHERE c.major_id IS NULL AND c.dept_id = m.dept_id;
