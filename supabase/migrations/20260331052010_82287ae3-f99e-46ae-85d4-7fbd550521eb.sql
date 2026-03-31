
-- Add new quest types
ALTER TYPE public.quest_type ADD VALUE IF NOT EXISTS 'economical';
ALTER TYPE public.quest_type ADD VALUE IF NOT EXISTS 'religious';

-- Create quest_locations linking table
CREATE TABLE public.quest_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id uuid NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  step_order integer NOT NULL DEFAULT 1,
  UNIQUE(quest_id, location_id)
);

ALTER TABLE public.quest_locations ENABLE ROW LEVEL SECURITY;

-- Everyone can view quest-location mappings
CREATE POLICY "Quest locations viewable by everyone"
  ON public.quest_locations FOR SELECT
  TO public USING (true);

-- Admins can manage quest locations
CREATE POLICY "Admins can manage quest locations"
  ON public.quest_locations FOR ALL
  TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update advance_quest to work, and create a function that auto-advances quests on checkin
CREATE OR REPLACE FUNCTION public.advance_quests_for_checkin(p_location_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_quest RECORD;
  v_results json[] := '{}';
  v_new_progress integer;
  v_total integer;
BEGIN
  -- Find all quests linked to this location that the user has started and not completed
  FOR v_quest IN
    SELECT uq.quest_id, uq.progress, q.total_steps
    FROM quest_locations ql
    JOIN user_quests uq ON uq.quest_id = ql.quest_id AND uq.user_id = auth.uid()
    JOIN quests q ON q.id = ql.quest_id
    WHERE ql.location_id = p_location_id
      AND uq.completed = false
      -- Ensure user hasn't already checked in at this location for this quest
      AND NOT EXISTS (
        SELECT 1 FROM checkins c
        JOIN quest_locations ql2 ON ql2.location_id = c.location_id AND ql2.quest_id = ql.quest_id
        WHERE c.user_id = auth.uid() AND c.location_id = p_location_id
        AND c.id != (SELECT id FROM checkins WHERE user_id = auth.uid() AND location_id = p_location_id ORDER BY created_at DESC LIMIT 1)
      )
  LOOP
    v_new_progress := v_quest.progress + 1;
    
    UPDATE user_quests
    SET progress = v_new_progress,
        completed = (v_new_progress >= v_quest.total_steps),
        completed_at = CASE WHEN v_new_progress >= v_quest.total_steps THEN now() ELSE NULL END
    WHERE user_id = auth.uid() AND quest_id = v_quest.quest_id;
    
    v_results := v_results || json_build_object('quest_id', v_quest.quest_id, 'progress', v_new_progress, 'completed', v_new_progress >= v_quest.total_steps)::json;
  END LOOP;
  
  RETURN array_to_json(v_results);
END;
$$;
