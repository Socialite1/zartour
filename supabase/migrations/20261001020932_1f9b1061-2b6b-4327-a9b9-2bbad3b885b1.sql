CREATE TABLE public.makgabeng_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  checkpoint int NOT NULL CHECK (checkpoint BETWEEN 1 AND 6),
  answer text,
  choice text,
  photo_path text,
  points_awarded int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, checkpoint)
);
GRANT SELECT ON public.makgabeng_checkpoints TO authenticated;
GRANT ALL ON public.makgabeng_checkpoints TO service_role;
ALTER TABLE public.makgabeng_checkpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own makgabeng entries" ON public.makgabeng_checkpoints FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

INSERT INTO public.badges (name, description, icon, required_checkins)
SELECT 'Guardian of Makgabeng', 'Completed all checkpoints of The Guardians of Makgabeng', '🏔️', 6
WHERE NOT EXISTS (SELECT 1 FROM public.badges WHERE name = 'Guardian of Makgabeng');

CREATE OR REPLACE FUNCTION public.submit_makgabeng_checkpoint(_checkpoint int, _answer text, _choice text, _photo_path text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _pts int;
  _done int;
  _badge uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _checkpoint < 1 OR _checkpoint > 6 THEN RAISE EXCEPTION 'Invalid checkpoint'; END IF;
  IF _photo_path IS NULL OR length(_photo_path) = 0 THEN RAISE EXCEPTION 'Photo required'; END IF;
  IF _answer IS NULL OR length(trim(_answer)) < 2 OR length(_answer) > 1000 THEN RAISE EXCEPTION 'Answer required'; END IF;
  IF _checkpoint = 1 AND upper(trim(_answer)) <> 'C' THEN RAISE EXCEPTION 'Not quite — try again!'; END IF;
  IF EXISTS (SELECT 1 FROM makgabeng_checkpoints WHERE user_id=_uid AND checkpoint=_checkpoint) THEN
    RAISE EXCEPTION 'Checkpoint already completed';
  END IF;
  _pts := CASE _checkpoint WHEN 1 THEN 100 WHEN 2 THEN 150 WHEN 3 THEN 150 WHEN 4 THEN 200 WHEN 5 THEN 150 ELSE 200 END;
  INSERT INTO makgabeng_checkpoints(user_id, checkpoint, answer, choice, photo_path, points_awarded)
  VALUES (_uid, _checkpoint, left(_answer,1000), left(_choice,100), left(_photo_path,300), _pts);
  UPDATE profiles SET points = points + _pts WHERE user_id = _uid;
  SELECT count(*) INTO _done FROM makgabeng_checkpoints WHERE user_id=_uid;
  IF _done = 6 THEN
    SELECT id INTO _badge FROM badges WHERE name='Guardian of Makgabeng' LIMIT 1;
    INSERT INTO user_badges(user_id, badge_id) VALUES (_uid, _badge) ON CONFLICT DO NOTHING;
  END IF;
  RETURN jsonb_build_object('points', _pts, 'completed', _done);
END $$;
REVOKE ALL ON FUNCTION public.submit_makgabeng_checkpoint(int,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_makgabeng_checkpoint(int,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_makgabeng_wall()
RETURNS TABLE(first_name text, message text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT split_part(coalesce(p.full_name,'Explorer'),' ',1), m.answer, m.created_at
  FROM makgabeng_checkpoints m LEFT JOIN profiles p ON p.user_id = m.user_id
  WHERE m.checkpoint = 6 ORDER BY m.created_at DESC LIMIT 50
$$;
GRANT EXECUTE ON FUNCTION public.get_makgabeng_wall() TO anon, authenticated;