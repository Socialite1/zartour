
-- Table to store user challenge responses per path
CREATE TABLE public.quest_path_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quest_id UUID NOT NULL,
  path_number INTEGER NOT NULL CHECK (path_number >= 1 AND path_number <= 10),
  response_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, quest_id, path_number)
);

ALTER TABLE public.quest_path_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own path responses"
ON public.quest_path_responses FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own path responses"
ON public.quest_path_responses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own path responses"
ON public.quest_path_responses FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all path responses"
ON public.quest_path_responses FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_quest_path_responses_updated_at
BEFORE UPDATE ON public.quest_path_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Walker of the Crown badge
INSERT INTO public.badges (name, description, icon, required_checkins)
VALUES ('Walker of the Crown', 'Completed The 10 Paths: Malkuth to Kether', '👑', 10);
