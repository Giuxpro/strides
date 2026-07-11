-- ============================================================
-- Effective streak — racha "viva" solo si hubo actividad hoy o ayer.
-- current_streak es la racha al momento de last_activity_date.
-- update_child_streak solo la recalcula cuando el niño juega, así que
-- entre sesiones queda congelada. Se computa al leer, sin polling ni cron.
-- ============================================================

create or replace function effective_streak(p_current smallint, p_last date)
returns smallint
language sql
stable
as $$
  select case
    when p_last >= current_date - 1 then coalesce(p_current, 0)
    else 0
  end::smallint;
$$;

-- Vista: fuente única para lecturas TS (perfil kids, analytics).
create view child_streaks_status
with (security_invoker = on) as
select
  child_id,
  current_streak,
  longest_streak,
  last_activity_date,
  updated_at,
  effective_streak(current_streak, last_activity_date) as effective_streak
from child_streaks;

grant select on child_streaks_status to authenticated;

-- Admin: la RPC de detalle usaba current_streak crudo → mostraba rachas muertas.
create or replace function get_admin_user_detail(p_user_id uuid)
returns table(child_id uuid, child_name text, child_age integer, child_avatar text, total_completions bigint, challenges_completed bigint, last_activity timestamp with time zone, current_streak integer, last_lesson_name text, last_module_name text, favorite_game text, total_game_plays bigint)
language sql
security definer
set search_path to 'public'
as $function$
  SELECT
    ch.id, ch.name, ch.age, ch.avatar_url,
    COUNT(DISTINCT clc.id)::bigint,
    COUNT(DISTINCT cdc.id)::bigint,
    GREATEST(
      MAX(clc.completed_at),
      MAX(cdc.completed_at),
      MAX(cgp.played_at)
    ),
    effective_streak(cs.current_streak, cs.last_activity_date),
    last_l.title_es,
    last_m.title_es,
    (
      SELECT cgp2.game_id FROM child_game_plays cgp2
      WHERE cgp2.child_id = ch.id
      GROUP BY cgp2.game_id ORDER BY COUNT(*) DESC LIMIT 1
    ),
    COUNT(DISTINCT cgp.id)::bigint
  FROM children ch
  LEFT JOIN child_lesson_completions clc ON clc.child_id = ch.id
  LEFT JOIN child_daily_challenges cdc ON cdc.child_id = ch.id
  LEFT JOIN child_streaks cs ON cs.child_id = ch.id
  LEFT JOIN child_game_plays cgp ON cgp.child_id = ch.id
  LEFT JOIN LATERAL (
    SELECT l.title_es, l.module_id
    FROM child_lesson_completions clc2
    JOIN lessons l ON l.id = clc2.lesson_id
    WHERE clc2.child_id = ch.id
    ORDER BY clc2.completed_at DESC LIMIT 1
  ) last_l ON true
  LEFT JOIN modules last_m ON last_m.id = last_l.module_id
  WHERE ch.parent_id = p_user_id
  GROUP BY ch.id, ch.name, ch.age, ch.avatar_url, cs.current_streak, cs.last_activity_date,
    last_l.title_es, last_m.title_es;
$function$;
