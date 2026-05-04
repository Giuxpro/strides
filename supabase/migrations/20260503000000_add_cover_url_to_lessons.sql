alter table lessons
  add column cover_url text;

-- URLs finales (ejecutar después de correr el script scripts/setup-storage.mjs)
-- update lessons set cover_url = 'https://ievftgzxiwtjocxnrmgv.supabase.co/storage/v1/object/public/lesson-cards/granja.png'   where slug = 'animales-granja';
-- update lessons set cover_url = 'https://ievftgzxiwtjocxnrmgv.supabase.co/storage/v1/object/public/lesson-cards/mascotas.png' where slug = 'mascotas';
-- update lessons set cover_url = 'https://ievftgzxiwtjocxnrmgv.supabase.co/storage/v1/object/public/lesson-cards/mar.png'      where slug = 'animales-mar';
-- update lessons set cover_url = 'https://ievftgzxiwtjocxnrmgv.supabase.co/storage/v1/object/public/lesson-cards/insectos.png' where slug = 'insectos';
