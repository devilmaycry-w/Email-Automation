/*
  # Create email logs table

  1. New Tables
    - `email_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `gmail_message_id` (text)
      - `sender_email` (text)
      - `subject` (text)
      - `category` (email_category)
      - `confidence_score` (numeric)
      - `response_sent` (boolean)
      - `response_template_id` (uuid, foreign key to email_templates)
      - `processed_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `email_logs` table
    - Add policy for users to view their own logs

  3. Indexes
    - Add indexes for common queries
*/

CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  gmail_message_id text,
  sender_email text NOT NULL,
  subject text NOT NULL,
  category email_category NOT NULL,
  confidence_score numeric(3,2) DEFAULT 0.5,
  response_sent boolean DEFAULT false,
  response_template_id uuid REFERENCES email_templates(id),
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own email logs
CREATE POLICY "Users can view own email logs"
  ON email_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can manage all logs (for automation)
CREATE POLICY "Service role can manage all logs"
  ON email_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_processed_at ON email_logs(processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_category ON email_logs(category);
CREATE INDEX IF NOT EXISTS idx_email_logs_gmail_message_id ON email_logs(gmail_message_id);