/*
  # Add additional email template categories

  1. Schema Changes
    - Add new values to the `email_category` enum:
      - feedback, followup, welcome, reengagement, product_review
      - billing, shipping, refund, technical, partnership
      - newsletter, appointment, complaint, compliment, survey
      - urgent, spam

  2. Notes
    - Uses ALTER TYPE ADD VALUE to extend the existing enum
    - Each category is added individually for compatibility
    - Categories match those defined in TemplateManager.tsx
*/

-- Add new email categories to the existing enum
-- Note: ALTER TYPE ADD VALUE must be done outside of a transaction block
-- and each value must be added separately

ALTER TYPE email_category ADD VALUE IF NOT EXISTS 'feedback';
ALTER TYPE email_category ADD VALUE IF NOT EXISTS 'followup';
ALTER TYPE email_category ADD VALUE IF NOT EXISTS 'welcome';
ALTER TYPE email_category ADD VALUE IF NOT EXISTS 'reengagement';
ALTER TYPE email_category ADD VALUE IF NOT EXISTS 'product_review';
ALTER TYPE email_category ADD VALUE IF NOT EXISTS 'billing';
ALTER TYPE email_category ADD VALUE IF NOT EXISTS 'shipping';
ALTER TYPE email_category ADD VALUE IF NOT EXISTS 'refund';
ALTER TYPE email_category ADD VALUE IF NOT EXISTS 'technical';
ALTER TYPE email_category ADD VALUE IF NOT EXISTS 'partnership';
ALTER TYPE email_category ADD VALUE IF NOT EXISTS 'newsletter';
ALTER TYPE email_category ADD VALUE IF NOT EXISTS 'appointment';
ALTER TYPE email_category ADD VALUE IF NOT EXISTS 'complaint';
ALTER TYPE email_category ADD VALUE IF NOT EXISTS 'compliment';
ALTER TYPE email_category ADD VALUE IF NOT EXISTS 'survey';
ALTER TYPE email_category ADD VALUE IF NOT EXISTS 'urgent';
ALTER TYPE email_category ADD VALUE IF NOT EXISTS 'spam';