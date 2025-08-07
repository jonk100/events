/*
  # Comments System

  1. New Tables
    - `comments`
      - `id` (uuid, primary key)
      - `event_occurrence_id` (uuid, foreign key to event_occurrences)
      - `user_name` (text, the name of the person commenting)
      - `comment` (text, the actual comment content)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on comments table
    - Add policies for authenticated users to perform CRUD operations
*/

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_occurrence_id uuid REFERENCES event_occurrences(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policies for comments
CREATE POLICY "Enable read access for all users" ON comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON comments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON comments FOR DELETE TO authenticated USING (true);

-- Create index for better performance when querying comments by event occurrence
CREATE INDEX idx_comments_event_occurrence_id ON comments(event_occurrence_id);
