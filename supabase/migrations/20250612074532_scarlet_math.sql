-- Drop table if exists to fully reset (optional, destructive!)
-- DROP TABLE IF EXISTS email_templates;

CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- user_id column removed
  category email_category NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
  -- UNIQUE(user_id, category) removed
);

-- Index updated to remove user_id
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);

-- Trigger remains the same
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS remains disabled (no restrictions)
ALTER TABLE email_templates DISABLE ROW LEVEL SECURITY;