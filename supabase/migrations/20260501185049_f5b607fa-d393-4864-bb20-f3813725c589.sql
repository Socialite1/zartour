DROP VIEW IF EXISTS public.team_vote_counts;
CREATE VIEW public.team_vote_counts WITH (security_invoker = true) AS
SELECT
  t.id,
  t.name,
  t.display_order,
  COUNT(v.id)::integer AS vote_count
FROM public.teams t
LEFT JOIN public.votes v ON v.team_id = t.id
GROUP BY t.id, t.name, t.display_order;