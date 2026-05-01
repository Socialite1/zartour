-- Teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teams viewable by everyone" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Admins manage teams" ON public.teams FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Votes table
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  voter_name TEXT NOT NULL,
  device_id TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (device_id)
);

CREATE INDEX idx_votes_team_id ON public.votes(team_id);
CREATE INDEX idx_votes_device_id ON public.votes(device_id);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Anyone can view votes (needed for leaderboard counts)
CREATE POLICY "Votes viewable by everyone" ON public.votes FOR SELECT USING (true);
-- Anyone can submit a vote
CREATE POLICY "Anyone can vote" ON public.votes FOR INSERT WITH CHECK (true);
-- Admins can delete (reset) votes
CREATE POLICY "Admins delete votes" ON public.votes FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- View aggregating vote counts per team
CREATE OR REPLACE VIEW public.team_vote_counts AS
SELECT
  t.id,
  t.name,
  t.display_order,
  COUNT(v.id)::integer AS vote_count
FROM public.teams t
LEFT JOIN public.votes v ON v.team_id = t.id
GROUP BY t.id, t.name, t.display_order;

-- Seed the 32 teams
INSERT INTO public.teams (name, display_order) VALUES
  ('One Family FC', 1),
  ('Mamaholo Brazil FC', 2),
  ('Djjabatho FC', 3),
  ('Sahlokwe Super United FC', 4),
  ('Bakone United FC', 5),
  ('Infinite FC', 6),
  ('Blue Print FC', 7),
  ('Sinesha United', 8),
  ('Barcelona FC', 9),
  ('Mampa Stormers', 10),
  ('Thamagane Dortmund FC', 11),
  ('Maijane Shooting Stars', 12),
  ('Melos FC', 13),
  ('Malekapane United Brothers', 14),
  ('Pula Ya Medupi FC', 15),
  ('Montjabala FC', 16),
  ('Dithabaneng Copperbelt', 17),
  ('Mphahlele United', 18),
  ('Always Ready FC', 19),
  ('Porto FC', 20),
  ('Seleteng Rise N Shine FC', 21),
  ('Sefalaolo Home Sweppers', 22),
  ('Northern Hippos FC', 23),
  ('Kan FC', 24),
  ('Sekurung Flying Bombers', 25),
  ('Mashiko FC', 26),
  ('Morocco FC', 27),
  ('Bolopa Chelsea', 28),
  ('Lesetsi Rams FC', 29),
  ('Tubatse United', 30),
  ('Matsepeng FC', 31),
  ('Papa Joe Rams FC', 32);

-- Enable realtime on votes
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;