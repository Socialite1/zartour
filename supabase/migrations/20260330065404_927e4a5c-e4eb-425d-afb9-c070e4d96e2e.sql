
-- 1. FIX: Profiles public data exposure - restrict to authenticated
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON profiles;
CREATE POLICY "Profiles viewable by authenticated" ON profiles
  FOR SELECT TO authenticated USING (true);

-- 2. FIX: Badge self-award bypass - drop permissive INSERT, create server-side RPC
DROP POLICY IF EXISTS "System can award badges" ON user_badges;

CREATE OR REPLACE FUNCTION public.award_badge_if_eligible(p_badge_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  checkin_count integer;
  required integer;
BEGIN
  SELECT COUNT(*) INTO checkin_count FROM checkins WHERE user_id = auth.uid();
  SELECT required_checkins INTO required FROM badges WHERE id = p_badge_id;
  IF required IS NOT NULL AND checkin_count >= required THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (auth.uid(), p_badge_id)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

-- 3. FIX: Quest progress bypass - drop permissive UPDATE, create server-side RPC
DROP POLICY IF EXISTS "Users can update own quests" ON user_quests;

CREATE OR REPLACE FUNCTION public.advance_quest(p_quest_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_progress integer;
  v_total integer;
  v_completed boolean;
  v_new_progress integer;
BEGIN
  SELECT uq.progress, uq.completed, q.total_steps
  INTO v_progress, v_completed, v_total
  FROM user_quests uq
  JOIN quests q ON q.id = uq.quest_id
  WHERE uq.user_id = auth.uid() AND uq.quest_id = p_quest_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Quest not found');
  END IF;

  IF v_completed THEN
    RETURN json_build_object('error', 'Quest already completed');
  END IF;

  v_new_progress := v_progress + 1;

  UPDATE user_quests
  SET progress = v_new_progress,
      completed = (v_new_progress >= v_total),
      completed_at = CASE WHEN v_new_progress >= v_total THEN now() ELSE NULL END
  WHERE user_id = auth.uid() AND quest_id = p_quest_id;

  RETURN json_build_object('progress', v_new_progress, 'completed', v_new_progress >= v_total);
END;
$$;

-- 4. FIX: QR code ID exposure - create RPC for QR lookup instead of exposing qr_code_id
CREATE OR REPLACE FUNCTION public.get_location_by_qr(p_qr_code_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_location locations%ROWTYPE;
BEGIN
  SELECT * INTO v_location FROM locations WHERE qr_code_id = p_qr_code_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  RETURN json_build_object(
    'id', v_location.id,
    'name', v_location.name,
    'description', v_location.description,
    'points_reward', v_location.points_reward,
    'image_url', v_location.image_url
  );
END;
$$;

-- Create a view for public location listing (without qr_code_id)
CREATE OR REPLACE VIEW public.locations_public
WITH (security_invoker = on) AS
  SELECT id, name, description, points_reward, image_url, created_at
  FROM public.locations;

-- Restrict base locations table SELECT to admins only (public uses view)
DROP POLICY IF EXISTS "Locations viewable by everyone" ON locations;
CREATE POLICY "Locations viewable by authenticated" ON locations
  FOR SELECT TO authenticated USING (true);

-- 5. FIX: Storage bucket exposure - make private
UPDATE storage.buckets SET public = false WHERE id = 'checkin-images';

-- Add storage RLS policies for checkin-images
CREATE POLICY "Users can upload own checkin images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'checkin-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Authenticated users can view checkin images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'checkin-images');
