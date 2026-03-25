
-- Create origin enum
CREATE TYPE public.user_origin AS ENUM ('around_ga_mphahlele', 'local_community', 'provincial', 'national');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  origin user_origin,
  points INTEGER NOT NULL DEFAULT 0,
  avatar_url TEXT,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Locations table
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  qr_code_id TEXT NOT NULL UNIQUE,
  image_url TEXT,
  points_reward INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Locations viewable by everyone" ON public.locations FOR SELECT USING (true);

-- Checkins table
CREATE TABLE public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  image_url TEXT,
  caption TEXT,
  points_earned INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, location_id)
);
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Checkins viewable by everyone" ON public.checkins FOR SELECT USING (true);
CREATE POLICY "Users can create own checkins" ON public.checkins FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Badges table
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '🏆',
  required_checkins INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges viewable by everyone" ON public.badges FOR SELECT USING (true);

-- User badges
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User badges viewable by everyone" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "System can award badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Quest types
CREATE TYPE public.quest_type AS ENUM ('astrology', 'ikigai', 'human_design');

-- Quests table
CREATE TABLE public.quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type quest_type NOT NULL,
  total_steps INTEGER NOT NULL DEFAULT 12,
  icon TEXT NOT NULL DEFAULT '✨',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quests viewable by everyone" ON public.quests FOR SELECT USING (true);

-- User quests progress
CREATE TABLE public.user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, quest_id)
);
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User quests viewable by own" ON public.user_quests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can start quests" ON public.user_quests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quests" ON public.user_quests FOR UPDATE USING (auth.uid() = user_id);

-- Likes table
CREATE TABLE public.checkin_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_id UUID NOT NULL REFERENCES public.checkins(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, checkin_id)
);
ALTER TABLE public.checkin_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes viewable by everyone" ON public.checkin_likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON public.checkin_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.checkin_likes FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for checkin images
INSERT INTO storage.buckets (id, name, public) VALUES ('checkin-images', 'checkin-images', true);
CREATE POLICY "Anyone can view checkin images" ON storage.objects FOR SELECT USING (bucket_id = 'checkin-images');
CREATE POLICY "Authenticated users can upload checkin images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'checkin-images' AND auth.role() = 'authenticated');

-- Seed badges
INSERT INTO public.badges (name, description, icon, required_checkins) VALUES
('First Steps', 'Complete your first check-in', '👣', 1),
('Explorer', 'Visit 5 different locations', '🧭', 5),
('Adventurer', 'Visit 10 different locations', '🗺️', 10),
('Cultural Ambassador', 'Visit 20 different locations', '🌍', 20),
('Legend', 'Visit 50 different locations', '👑', 50);

-- Seed quests
INSERT INTO public.quests (title, description, type, total_steps, icon) VALUES
('Astrology Journey', 'Explore the 12 houses of astrology through cultural landmarks', 'astrology', 12, '♈'),
('Ikigai Discovery', 'Find your purpose through 8 guided cultural experiences', 'ikigai', 8, '🎯'),
('Human Design Path', 'Unlock your unique design through 10 self-discovery stages', 'human_design', 10, '🧬');

-- Seed locations
INSERT INTO public.locations (name, description, qr_code_id, points_reward) VALUES
('Ga-Mphahlele Heritage Center', 'Explore the rich history of the Mphahlele people', 'loc_heritage_center', 15),
('Modjadji Cycad Reserve', 'Ancient cycad forest of the Rain Queen', 'loc_cycad_reserve', 20),
('Letaba River Trail', 'Scenic trail along the Letaba River', 'loc_letaba_trail', 10),
('Cultural Village Museum', 'Traditional homestead and living museum', 'loc_cultural_village', 15),
('Sunset Viewpoint', 'Panoramic views of the Limpopo valley', 'loc_sunset_viewpoint', 10),
('Artisan Market Square', 'Local crafts and cultural marketplace', 'loc_artisan_market', 10);
