/*
  # Add last poll timestamp to users table

  1. Schema Changes
    - Add `last_poll_timestamp` column to `users` table
    - This will track when each user's inbox was last processed

  2. Security
    - Existing RLS policies should cover this new column
    - Users can update their own last_poll_timestamp
*/

-- Add last_poll_timestamp column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_poll_timestamp TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN public.users.last_poll_timestamp IS 'Timestamp of the last successful email poll for this user';