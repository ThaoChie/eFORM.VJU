-- V16__Add_evaluation_period_to_score_forms.sql
-- Link score_forms directly to evaluation_periods for accurate lifecycle tracking and real-time statistics

ALTER TABLE score_forms ADD COLUMN IF NOT EXISTS evaluation_period_id BIGINT REFERENCES evaluation_periods(id);
CREATE INDEX IF NOT EXISTS idx_score_forms_period_id ON score_forms(evaluation_period_id);

-- Associate legacy score forms with the currently active evaluation period for their semester
UPDATE score_forms sf
SET evaluation_period_id = ep.id
FROM evaluation_periods ep
WHERE sf.evaluation_period_id IS NULL
  AND sf.semester_id = ep.semester_id
  AND ep.status = 'DANG_MO';
