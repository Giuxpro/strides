-- lesson_steps.step_type: enum → text.
-- El catálogo de tipos de paso es STEP_REGISTRY (código). Igual que exercise_type,
-- agregar un tipo nuevo (p.ej. 'evaluation') = una línea en el registry, sin migración.
alter table lesson_steps alter column step_type type text using step_type::text;
drop type step_type;
