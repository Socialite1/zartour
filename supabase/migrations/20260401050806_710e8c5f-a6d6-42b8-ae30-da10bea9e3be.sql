
-- Location stories: rich content shown after scanning QR
CREATE TABLE public.location_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  story_text text NOT NULL,
  fun_fact text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(location_id)
);

ALTER TABLE public.location_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stories viewable by authenticated"
ON public.location_stories FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage stories"
ON public.location_stories FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Quiz questions per location (3 per location)
CREATE TABLE public.location_quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  correct_option text NOT NULL CHECK (correct_option IN ('a', 'b', 'c')),
  question_order integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.location_quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quiz questions viewable by authenticated"
ON public.location_quiz_questions FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage quiz questions"
ON public.location_quiz_questions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- User quiz answers
CREATE TABLE public.user_quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_id uuid NOT NULL REFERENCES public.location_quiz_questions(id) ON DELETE CASCADE,
  selected_option text NOT NULL CHECK (selected_option IN ('a', 'b', 'c')),
  is_correct boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

ALTER TABLE public.user_quiz_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own answers"
ON public.user_quiz_answers FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own answers"
ON public.user_quiz_answers FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Location feedback/ratings
CREATE TABLE public.location_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, location_id)
);

ALTER TABLE public.location_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback"
ON public.location_feedback FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
ON public.location_feedback FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add lat/lng to locations for map directions
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS longitude double precision;
