/*
  # Remove user_name field from comments table

  1. Changes
    - Remove `user_name` column from comments table
    - This simplifies the comments system by removing the need for users to provide names

  2. Security
    - No changes to RLS policies needed
*/

-- Remove user_name column from comments table
ALTER TABLE comments DROP COLUMN IF EXISTS user_name;
