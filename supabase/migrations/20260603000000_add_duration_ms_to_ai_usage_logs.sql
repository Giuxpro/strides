-- Agrega duración de audio (ms) a ai_usage_logs.
-- Usado por Whisper para calcular costo real ($0.006/min).
-- Nullable: los logs de generación de contenido no tienen duración.
ALTER TABLE ai_usage_logs ADD COLUMN duration_ms integer;
