/*
  # Create email templates table

  1. New Tables
    - `email_templates`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `category` (text, enum: order, support, general)
      - `subject` (text)
      - `body` (text)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `email_templates` table
    - Add policy for users to manage their own templates

  3. Default Templates
    - Insert default templates for each category
*/

-- Create enum for email categories
DO $$ BEGIN
  CREATE TYPE email_category AS ENUM ('order', 'support', 'general');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  category email_category NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category)
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Users can manage their own templates
CREATE POLICY "Users can manage own templates"
  ON email_templates
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for fast user and category lookups
CREATE INDEX IF NOT EXISTS idx_email_templates_user_category ON email_templates(user_id, category);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();