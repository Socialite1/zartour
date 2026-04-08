
-- Point rewards milestone table
CREATE TABLE public.point_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  points_threshold integer NOT NULL,
  reward_name text NOT NULL,
  reward_description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.point_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Point rewards viewable by all" ON public.point_rewards
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage point rewards" ON public.point_rewards
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- User reward claims table
CREATE TABLE public.user_reward_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reward_id uuid NOT NULL REFERENCES public.point_rewards(id) ON DELETE CASCADE,
  reward_choice text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  claimed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, reward_id)
);

ALTER TABLE public.user_reward_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own claims" ON public.user_reward_claims
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can claim rewards" ON public.user_reward_claims
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all claims" ON public.user_reward_claims
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed the 700-point milestone with reward options
INSERT INTO public.point_rewards (points_threshold, reward_name, reward_description)
VALUES (700, '700 Points Milestone', 'Choose your reward: Groceries worth R300, 12-pack beer cans, or a Bread & Breakfast trip');
