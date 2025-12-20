-- 2025-12-19: Admin view of students and loved ones
BEGIN;

CREATE OR REPLACE VIEW public.awy_connections_admin_view AS
SELECT
  c.id AS connection_id,
  c.status,
  c.invited_at,
  c.accepted_at,
  c.updated_at,
  c.student_id,
  sp.display_name AS student_name,
  au.email AS student_email,
  c.loved_email,
  c.loved_one_id,
  lp.display_name AS loved_name,
  c.relationship,
  c.relationship_label,
  c.nickname
FROM public.awy_connections c
LEFT JOIN public.profiles sp ON sp.id = c.student_id
LEFT JOIN auth.users au ON au.id = c.student_id
LEFT JOIN public.profiles lp ON lp.id = COALESCE(c.loved_one_id, c.loved_user_id);

COMMIT;
