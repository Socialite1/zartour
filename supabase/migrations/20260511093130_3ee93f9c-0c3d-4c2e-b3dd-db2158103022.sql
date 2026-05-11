-- EVENTS TABLE
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id uuid NOT NULL,
  title text NOT NULL,
  event_type text NOT NULL DEFAULT 'party',
  description text,
  venue text,
  event_date timestamptz NOT NULL,
  image_url text,
  ticket_info text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_date ON public.events(event_date DESC);
CREATE INDEX idx_events_guide ON public.events(guide_id);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events viewable by authenticated" ON public.events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Approved guides can create events" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (guide_id IN (
    SELECT id FROM guide_profiles
    WHERE user_id = auth.uid() AND is_approved = true
  ));

CREATE POLICY "Guides can update own events" ON public.events
  FOR UPDATE TO authenticated
  USING (guide_id IN (SELECT id FROM guide_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Guides can delete own events" ON public.events
  FOR DELETE TO authenticated
  USING (guide_id IN (SELECT id FROM guide_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins manage events" ON public.events
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- EVENT CHECK-INS
CREATE TABLE public.event_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  points_earned integer NOT NULL DEFAULT 25,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

ALTER TABLE public.event_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event checkins viewable by all auth" ON public.event_checkins
  FOR SELECT TO authenticated USING (true);

-- inserts go through RPC only

-- EVENT RATINGS
CREATE TABLE public.event_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL,
  review text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE OR REPLACE FUNCTION public.validate_event_rating()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'rating must be between 1 and 5';
  END IF;
  IF NEW.review IS NOT NULL AND length(NEW.review) > 500 THEN
    RAISE EXCEPTION 'review too long';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER event_ratings_validate
  BEFORE INSERT OR UPDATE ON public.event_ratings
  FOR EACH ROW EXECUTE FUNCTION public.validate_event_rating();

CREATE TRIGGER event_ratings_updated_at
  BEFORE UPDATE ON public.event_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.event_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ratings viewable by authenticated" ON public.event_ratings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users insert own ratings" ON public.event_ratings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own ratings" ON public.event_ratings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users delete own ratings" ON public.event_ratings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- TOP EVENTS VIEW
CREATE OR REPLACE VIEW public.top_events
WITH (security_invoker = true) AS
SELECT
  e.id,
  e.title,
  e.event_type,
  e.venue,
  e.event_date,
  e.image_url,
  e.guide_id,
  COALESCE(c.checkin_count, 0)::int AS checkin_count,
  COALESCE(r.rating_count, 0)::int AS rating_count,
  COALESCE(r.avg_rating, 0)::numeric(3,2) AS avg_rating
FROM public.events e
LEFT JOIN (
  SELECT event_id, COUNT(*) AS checkin_count FROM event_checkins GROUP BY event_id
) c ON c.event_id = e.id
LEFT JOIN (
  SELECT event_id, COUNT(*) AS rating_count, AVG(rating) AS avg_rating FROM event_ratings GROUP BY event_id
) r ON r.event_id = e.id;

GRANT SELECT ON public.top_events TO authenticated, anon;

-- CHECK-IN RPC: award 25 points
CREATE OR REPLACE FUNCTION public.checkin_to_event(p_event_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_points integer := 25;
  v_exists boolean;
  v_event_exists boolean;
BEGIN
  IF v_uid IS NULL THEN RETURN json_build_object('error','Not authenticated'); END IF;

  SELECT EXISTS(SELECT 1 FROM events WHERE id = p_event_id) INTO v_event_exists;
  IF NOT v_event_exists THEN RETURN json_build_object('error','Event not found'); END IF;

  SELECT EXISTS(SELECT 1 FROM event_checkins WHERE event_id = p_event_id AND user_id = v_uid) INTO v_exists;
  IF v_exists THEN RETURN json_build_object('error','Already checked in'); END IF;

  INSERT INTO event_checkins(event_id, user_id, points_earned) VALUES (p_event_id, v_uid, v_points);
  UPDATE profiles SET points = points + v_points WHERE user_id = v_uid;

  RETURN json_build_object('success', true, 'points_earned', v_points);
END $$;

REVOKE EXECUTE ON FUNCTION public.checkin_to_event(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.checkin_to_event(uuid) TO authenticated;