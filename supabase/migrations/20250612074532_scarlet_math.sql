-- Drop existing policy if any
DROP POLICY IF EXISTS "Users can manage own templates" ON email_templates;

-- Disable Row Level Security (RLS)
ALTER TABLE email_templates DISABLE ROW LEVEL SECURITY;

-- Optional: Drop enum if you want to fully simplify the structure
-- DROP TYPE IF EXISTS email_category;

-- Table definition remains the same
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

-- Keep index for performance
CREATE INDEX IF NOT EXISTS idx_email_templates_user_category ON email_templates(user_id, category);

-- Trigger to auto-update updated_at timestamp
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
