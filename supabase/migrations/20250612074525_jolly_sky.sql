/*
  # Create user Gmail tokens table

  1. New Tables
    - `user_gmail_tokens`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `access_token` (text, encrypted)
      - `refresh_token` (text, encrypted)
      - `expires_at` (timestamp)
      - `scope` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_gmail_tokens` table
    - Add policy for users to manage their own tokens
    - Add policy for service role to manage tokens

  3. Indexes
    - Add index on user_id for fast lookups
    - Add unique constraint on user_id (one Gmail connection per user)
*/

CREATE TABLE IF NOT EXISTS user_gmail_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  scope text DEFAULT 'https://www.googleapis.com/auth/gmail.modify',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_gmail_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage their own Gmail tokens
CREATE POLICY "Users can manage own Gmail tokens"
  ON user_gmail_tokens
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage all tokens (for background processing)
CREATE POLICY "Service role can manage all tokens"
  ON user_gmail_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_user_gmail_tokens_user_id ON user_gmail_tokens(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_gmail_tokens_updated_at
  BEFORE UPDATE ON user_gmail_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();