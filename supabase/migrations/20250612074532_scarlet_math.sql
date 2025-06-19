-- 1. Add user_id back and reference auth.users(id)
ALTER TABLE email_templates
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Reinstate unique constraint for per-user category
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'email_templates_user_id_category_key'
  ) THEN
    ALTER TABLE email_templates
      ADD CONSTRAINT email_templates_user_id_category_key UNIQUE(user_id, category);
  END IF;
END$$;

-- 3. Enable Row Level Security
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- 4. Create policy to ensure users can only access their own templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users can manage own templates'
      AND tablename = 'email_templates'
  ) THEN
    CREATE POLICY "Users can manage own templates" ON email_templates
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- 5. (Optional) Set user_id to NOT NULL if every template must belong to a user
ALTER TABLE email_templates
  ALTER COLUMN user_id SET NOT NULL;