-- exercises.type: enum → text.
-- El catálogo de tipos de ejercicio es GAME_REGISTRY (código), validado en la
-- capa de app (isValidExerciseType). La BD ya no guarda la lista de valores, así
-- que agregar un juego nuevo = una línea en el registry, sin migración.
alter table exercises alter column type type text using type::text;
drop type exercise_type;
