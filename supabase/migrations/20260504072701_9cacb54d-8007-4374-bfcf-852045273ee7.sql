-- Daily login bonus tracking
CREATE TABLE public.daily_logins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  login_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  points_awarded INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, login_date)
);

ALTER TABLE public.daily_logins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily logins"
  ON public.daily_logins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all daily logins"
  ON public.daily_logins FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Server-side claim function: awards 3 points once per UTC day
CREATE OR REPLACE FUNCTION public.claim_daily_login_bonus()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'UTC')::date;
  v_points integer := 3;
  v_inserted boolean := false;
  v_new_total integer;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;

  INSERT INTO public.daily_logins (user_id, login_date, points_awarded)
  VALUES (v_uid, v_today, v_points)
  ON CONFLICT (user_id, login_date) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted THEN
    UPDATE public.profiles
    SET points = points + v_points
    WHERE user_id = v_uid
    RETURNING points INTO v_new_total;

    RETURN json_build_object('claimed', true, 'points_awarded', v_points, 'total_points', v_new_total);
  ELSE
    SELECT points INTO v_new_total FROM public.profiles WHERE user_id = v_uid;
    RETURN json_build_object('claimed', false, 'already_claimed_today', true, 'total_points', v_new_total);
  END IF;
END;
$$;