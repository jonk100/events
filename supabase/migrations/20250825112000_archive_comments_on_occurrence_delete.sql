-- Archive comments instead of deleting when an event_occurrence is removed
-- 1) Ensure archived/updated_at columns exist on comments
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- 2) Replace FK to use ON DELETE SET NULL instead of CASCADE
DO $$
BEGIN
  -- Drop existing FK if it exists (name may vary; using the default name here)
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'comments_event_occurrence_id_fkey'
  ) THEN
    ALTER TABLE comments DROP CONSTRAINT comments_event_occurrence_id_fkey;
  END IF;
END $$;

ALTER TABLE comments
  ADD CONSTRAINT comments_event_occurrence_id_fkey
  FOREIGN KEY (event_occurrence_id)
  REFERENCES event_occurrences(id)
  ON DELETE SET NULL;

-- 3) Create trigger to archive comments before deleting an occurrence
CREATE OR REPLACE FUNCTION archive_comments_before_occurrence_delete()
RETURNS trigger AS $$
BEGIN
  -- Mark related comments as archived and update timestamp
  UPDATE comments
    SET archived = true,
        updated_at = now()
  WHERE event_occurrence_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger to avoid duplicates
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_archive_comments_before_occurrence_delete'
  ) THEN
    DROP TRIGGER trg_archive_comments_before_occurrence_delete ON event_occurrences;
  END IF;
END $$;

CREATE TRIGGER trg_archive_comments_before_occurrence_delete
BEFORE DELETE ON event_occurrences
FOR EACH ROW
EXECUTE FUNCTION archive_comments_before_occurrence_delete();
