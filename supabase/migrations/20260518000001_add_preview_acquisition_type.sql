ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_acquisition_type_check;

ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_acquisition_type_check
  CHECK (acquisition_type IN ('trial', 'prepaid', 'complimentary', 'preview'));
