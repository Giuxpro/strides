-- Add p_plan and p_status filter params to admin user RPCs.
-- Must DROP first because PostgreSQL can't change parameter count with CREATE OR REPLACE.

DROP FUNCTION IF EXISTS public.get_admin_users_overview(TEXT, INT, INT);
DROP FUNCTION IF EXISTS public.get_admin_users_count(TEXT);

CREATE FUNCTION public.get_admin_users_overview(
  p_search TEXT DEFAULT NULL,
  p_limit  INT  DEFAULT 25,
  p_offset INT  DEFAULT 0,
  p_plan   TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  id                       UUID,
  email                    TEXT,
  display_name             TEXT,
  joined_at                TIMESTAMPTZ,
  last_sign_in_at          TIMESTAMPTZ,
  acquisition_type         TEXT,
  status                   TEXT,
  trial_ends_at            TIMESTAMPTZ,
  sub_created_at           TIMESTAMPTZ,
  redeemed_code            TEXT,
  pending_discount_percent INT,
  pending_discount_months  INT,
  children_count           BIGINT,
  total_completions        BIGINT,
  last_activity            TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id,
    u.email::TEXT,
    p.display_name::TEXT,
    p.created_at             AS joined_at,
    u.last_sign_in_at,
    s.acquisition_type::TEXT,
    s.status::TEXT,
    s.trial_ends_at,
    s.created_at             AS sub_created_at,
    ac.code::TEXT            AS redeemed_code,
    s.pending_discount_percent,
    s.pending_discount_months,
    COUNT(DISTINCT c.id)     AS children_count,
    COUNT(DISTINCT clc.id)   AS total_completions,
    MAX(clc.completed_at)    AS last_activity
  FROM auth.users u
  JOIN profiles p ON p.id = u.id
  LEFT JOIN subscriptions s ON s.user_id = u.id
  LEFT JOIN access_codes ac ON ac.id = s.redeemed_code_id
  LEFT JOIN children c ON c.parent_id = u.id
  LEFT JOIN child_lesson_completions clc ON clc.child_id = c.id
  WHERE p.role != 'admin'
    AND (p_search IS NULL OR u.email ILIKE '%' || p_search || '%' OR p.display_name ILIKE '%' || p_search || '%')
    AND (p_plan   IS NULL OR s.acquisition_type = p_plan)
    AND (p_status IS NULL OR s.status = p_status)
  GROUP BY
    u.id, u.email, p.display_name, p.created_at, u.last_sign_in_at,
    s.acquisition_type, s.status, s.trial_ends_at, s.created_at,
    ac.code, s.pending_discount_percent, s.pending_discount_months
  ORDER BY p.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
$$;

CREATE FUNCTION public.get_admin_users_count(
  p_search TEXT DEFAULT NULL,
  p_plan   TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT u.id)
  FROM auth.users u
  JOIN profiles p ON p.id = u.id
  LEFT JOIN subscriptions s ON s.user_id = u.id
  WHERE p.role != 'admin'
    AND (p_search IS NULL OR u.email ILIKE '%' || p_search || '%' OR p.display_name ILIKE '%' || p_search || '%')
    AND (p_plan   IS NULL OR s.acquisition_type = p_plan)
    AND (p_status IS NULL OR s.status = p_status);
$$;
