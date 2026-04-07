
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS quest_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS quest_task text,
  ADD COLUMN IF NOT EXISTS quest_reward text,
  ADD COLUMN IF NOT EXISTS checkin_type text NOT NULL DEFAULT 'qr',
  ADD COLUMN IF NOT EXISTS time_restriction text;
