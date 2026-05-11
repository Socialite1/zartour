-- Zartour Club membership system
CREATE TABLE public.club_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  total_points_spent integer NOT NULL DEFAULT 0,
  renewal_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.club_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own membership" ON public.club_memberships
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins manage memberships" ON public.club_memberships
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER club_memberships_updated_at
  BEFORE UPDATE ON public.club_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: is current user an active club member
CREATE OR REPLACE FUNCTION public.is_club_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_memberships
    WHERE user_id = _user_id AND expires_at > now()
  )
$$;

-- Join or renew Zartour Club: spend points, add 30 days
CREATE OR REPLACE FUNCTION public.join_zartour_club()
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_cost integer := 100;
  v_points integer;
  v_existing club_memberships%ROWTYPE;
  v_new_expires timestamptz;
  v_renewal boolean := false;
BEGIN
  IF v_uid IS NULL THEN RETURN json_build_object('error','Not authenticated'); END IF;

  SELECT points INTO v_points FROM profiles WHERE user_id = v_uid;
  IF v_points IS NULL THEN RETURN json_build_object('error','Profile not found'); END IF;
  IF v_points < v_cost THEN
    RETURN json_build_object('error','Not enough points','required',v_cost,'have',v_points);
  END IF;

  SELECT * INTO v_existing FROM club_memberships WHERE user_id = v_uid;

  UPDATE profiles SET points = points - v_cost WHERE user_id = v_uid;

  IF FOUND AND v_existing.id IS NOT NULL THEN
    v_renewal := true;
    v_new_expires := GREATEST(v_existing.expires_at, now()) + interval '30 days';
    UPDATE club_memberships
      SET expires_at = v_new_expires,
          total_points_spent = total_points_spent + v_cost,
          renewal_count = renewal_count + 1
      WHERE user_id = v_uid;
  ELSE
    v_new_expires := now() + interval '30 days';
    INSERT INTO club_memberships(user_id, expires_at, total_points_spent)
    VALUES (v_uid, v_new_expires, v_cost);
  END IF;

  RETURN json_build_object(
    'success', true,
    'renewal', v_renewal,
    'expires_at', v_new_expires,
    'points_spent', v_cost,
    'remaining_points', v_points - v_cost
  );
END;
$$;