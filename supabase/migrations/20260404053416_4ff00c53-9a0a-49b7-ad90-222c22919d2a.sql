
-- Make guide_id NOT NULL on quests (all existing quests should already have a guide_id, 
-- but first set any NULLs to prevent errors)
UPDATE public.quests SET guide_id = (SELECT id FROM public.guide_profiles LIMIT 1) WHERE guide_id IS NULL;
ALTER TABLE public.quests ALTER COLUMN guide_id SET NOT NULL;
