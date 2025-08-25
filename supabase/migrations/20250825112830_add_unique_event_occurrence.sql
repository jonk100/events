-- Ensure unique (event_id, country_id, start_month, end_month) in event_occurrences
-- 1) Deduplicate existing rows by reassigning comments and deleting extras
DO $$
DECLARE
  r RECORD;
BEGIN
  -- For each duplicate group, keep the smallest id and remove others
  FOR r IN
    SELECT event_id, country_id, start_month, end_month
    FROM event_occurrences
    GROUP BY event_id, country_id, start_month, end_month
    HAVING COUNT(*) > 1
  LOOP
    -- Find the id to keep (smallest id for stability)
    PERFORM 1;
    WITH ranked AS (
      SELECT id,
             ROW_NUMBER() OVER (ORDER BY id) AS rn
      FROM event_occurrences eo
      WHERE eo.event_id = r.event_id
        AND eo.country_id = r.country_id
        AND eo.start_month = r.start_month
        AND eo.end_month = r.end_month
    )
    -- Reassign comments from duplicates to the kept row
    , kept AS (
      SELECT id FROM ranked WHERE rn = 1
    )
    UPDATE comments c
      SET event_occurrence_id = (SELECT id FROM kept)
    WHERE c.event_occurrence_id IN (
      SELECT id FROM ranked WHERE rn > 1
    );

    -- Delete duplicate occurrence rows (comments have been moved)
    DELETE FROM event_occurrences eo
    WHERE eo.id IN (
      SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
        FROM event_occurrences
        WHERE event_id = r.event_id
          AND country_id = r.country_id
          AND start_month = r.start_month
          AND end_month = r.end_month
      ) t
      WHERE t.rn > 1
    );
  END LOOP;
END $$;

-- 2) Add a unique constraint to prevent future duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.event_occurrences'::regclass
      AND contype = 'u'
      AND conname = 'event_occurrences_event_country_month_uniq'
  ) THEN
    ALTER TABLE event_occurrences
      ADD CONSTRAINT event_occurrences_event_country_month_uniq
      UNIQUE (event_id, country_id, start_month, end_month);
  END IF;
END $$;
