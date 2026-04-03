
-- Accommodations table
CREATE TABLE public.accommodations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'lodge',
  price_range text,
  contact_phone text,
  contact_email text,
  address text,
  latitude double precision,
  longitude double precision,
  image_url text,
  guide_id uuid REFERENCES public.guide_profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.accommodations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accommodations viewable by all" ON public.accommodations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage accommodations" ON public.accommodations FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Guides can insert own accommodations" ON public.accommodations FOR INSERT TO authenticated WITH CHECK (guide_id IN (SELECT id FROM guide_profiles WHERE user_id = auth.uid() AND is_approved = true));
CREATE POLICY "Guides can update own accommodations" ON public.accommodations FOR UPDATE TO authenticated USING (guide_id IN (SELECT id FROM guide_profiles WHERE user_id = auth.uid()));

-- Accommodation bookings table
CREATE TABLE public.accommodation_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  accommodation_id uuid NOT NULL REFERENCES public.accommodations(id),
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  guests integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.accommodation_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own accommodation bookings" ON public.accommodation_bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own accommodation bookings" ON public.accommodation_bookings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all accommodation bookings" ON public.accommodation_bookings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
