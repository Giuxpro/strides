-- Modelo A: suscripción prepaid con vencimiento.
-- current_period_end es el cimiento que reusará el modelo B (recurrente): en A lo mueve
-- un pago manual + cron; en B lo extenderá el evento de renovación del proveedor.

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz;

-- Idempotencia de los webhooks entrantes del payment-service: cada event_id se procesa
-- una sola vez (la app deduplica reintentos del servicio).
CREATE TABLE IF NOT EXISTS payment_webhook_events (
  event_id     text PRIMARY KEY,
  received_at  timestamptz NOT NULL DEFAULT now()
);

-- Solo el service-role (el receiver) escribe aquí; sin políticas, nadie más accede.
ALTER TABLE payment_webhook_events ENABLE ROW LEVEL SECURITY;

-- Backfill: expirar prepaid ya vencidos.
UPDATE subscriptions
SET    status = 'expired'
WHERE  acquisition_type = 'prepaid'
  AND  current_period_end < NOW()
  AND  status = 'active';

-- Cron horario para vencer prepaid (mismo patrón que expire-trials).
SELECT cron.schedule(
  'expire-prepaid',
  '0 * * * *',
  $$
    UPDATE subscriptions
    SET    status = 'expired'
    WHERE  acquisition_type = 'prepaid'
      AND  current_period_end < NOW()
      AND  status = 'active';
  $$
);
