-- Fix anti-pattern: trial expiry was computed client-side instead of in the DB.
-- 1. Backfill: mark already-expired trials as 'expired' right now.
-- 2. Schedule a pg_cron job to keep it updated every hour going forward.

UPDATE subscriptions
SET    status = 'expired'
WHERE  acquisition_type = 'trial'
  AND  trial_ends_at < NOW()
  AND  status = 'active';

-- Requires pg_cron extension (enabled by default in Supabase).
SELECT cron.schedule(
  'expire-trials',           -- job name (unique)
  '0 * * * *',               -- every hour on the hour
  $$
    UPDATE subscriptions
    SET    status = 'expired'
    WHERE  acquisition_type = 'trial'
      AND  trial_ends_at < NOW()
      AND  status = 'active';
  $$
);
