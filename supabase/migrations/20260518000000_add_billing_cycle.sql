ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS billing_cycle text
  CHECK (billing_cycle IN ('monthly', 'annual'));
