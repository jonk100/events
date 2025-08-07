/*
 # Event Calendar Schema
 
 1. New Tables
 - `events`
 - `id` (uuid, primary key)
 - `name` (text, unique)
 - `created_at` (timestamp)
 - `countries`
 - `id` (uuid, primary key)
 - `name` (text, unique)
 - `created_at` (timestamp)
 - `event_occurrences`
 - `id` (uuid, primary key)
 - `event_id` (uuid, foreign key)
 - `country_id` (uuid, foreign key)
 - `start_month` (integer)
 - `end_month` (integer)
 - `created_at` (timestamp)
 
 2. Security
 - Enable RLS on all tables
 - Add policies for authenticated users to perform CRUD operations
 */
-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
-- Create countries table
CREATE TABLE IF NOT EXISTS countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
-- Create event_occurrences table
CREATE TABLE IF NOT EXISTS event_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  country_id uuid REFERENCES countries(id) ON DELETE CASCADE,
  start_month integer NOT NULL CHECK (
    start_month BETWEEN 1 AND 12
  ),
  end_month integer NOT NULL CHECK (
    end_month BETWEEN 1 AND 12
  ),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_month_range CHECK (start_month <= end_month)
);
-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_occurrences ENABLE ROW LEVEL SECURITY;
-- Create policies
CREATE POLICY "Enable read access for all users" ON events FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON events FOR
INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON events FOR
UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON events FOR DELETE TO authenticated USING (true);
CREATE POLICY "Enable read access for all users" ON countries FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON countries FOR
INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON countries FOR
UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON countries FOR DELETE TO authenticated USING (true);
CREATE POLICY "Enable read access for all users" ON event_occurrences FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON event_occurrences FOR
INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON event_occurrences FOR
UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON event_occurrences FOR DELETE TO authenticated USING (true);
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
-- Create event_occurences_monthly table
CREATE TABLE IF NOT EXISTS event_occurences_monthly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  country_id uuid REFERENCES countries(id) ON DELETE CASCADE,
  month integer NOT NULL CHECK (
    start_month BETWEEN 1 AND 12
  ),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_month_range CHECK (start_month <= end_month)
) -- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_occurrence_id uuid REFERENCES event_occurences(id) ON DELETE CASCADE,
  event_occurrence_monthly_id uuid REFERENCES event_occurrences_monthly(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);
-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
-- Create policies for comments
CREATE POLICY "Enable read access for all users" ON comments FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON comments FOR
INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON comments FOR
UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON comments FOR DELETE TO authenticated USING (true);
-- Create index for better performance when querying comments by event occurrence
CREATE INDEX idx_comments_event_occurrence_monthly_id ON comments(event_occurrence_monthly_id);