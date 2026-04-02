
-- Guide/establishment profiles table
CREATE TABLE public.guide_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  business_name text NOT NULL,
  description text,
  contact_email text,
  contact_phone text,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guide_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guides can view own profile" ON public.guide_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Guides can update own profile" ON public.guide_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Guides can insert own profile" ON public.guide_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage guide profiles" ON public.guide_profiles
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Approved guides viewable by all" ON public.guide_profiles
  FOR SELECT TO authenticated USING (is_approved = true);

-- Tour bookings table
CREATE TABLE public.tour_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quest_id uuid NOT NULL,
  guide_id uuid NOT NULL REFERENCES public.guide_profiles(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  booking_date date NOT NULL,
  party_size integer NOT NULL DEFAULT 1,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tour_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings" ON public.tour_bookings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings" ON public.tour_bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Guides can view their bookings" ON public.tour_bookings
  FOR SELECT TO authenticated USING (
    guide_id IN (SELECT id FROM guide_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Guides can update their bookings" ON public.tour_bookings
  FOR UPDATE TO authenticated USING (
    guide_id IN (SELECT id FROM guide_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all bookings" ON public.tour_bookings
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add guide_id to quests so guides can own quests
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS guide_id uuid REFERENCES public.guide_profiles(id);

-- Allow guides to manage their own quests
CREATE POLICY "Guides can insert own quests" ON public.quests
  FOR INSERT TO authenticated WITH CHECK (
    guide_id IN (SELECT id FROM guide_profiles WHERE user_id = auth.uid() AND is_approved = true)
  );

CREATE POLICY "Guides can update own quests" ON public.quests
  FOR UPDATE TO authenticated USING (
    guide_id IN (SELECT id FROM guide_profiles WHERE user_id = auth.uid())
  );

-- Allow admins to manage quests
CREATE POLICY "Admins can manage quests" ON public.quests
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
