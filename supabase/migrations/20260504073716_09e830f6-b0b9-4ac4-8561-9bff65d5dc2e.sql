
-- Add category column to locations
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS category text;

-- Tag nightlife venues (taverns, bars, lounges, clubs, lodges, B&Bs, casinos)
UPDATE public.locations SET category = 'nightlife' WHERE name IN (
  'Marys Bar Lounge',
  'Full Joints',
  'The Loft',
  'Blue Roof',
  'Meropa Casino & Entertainment',
  'The Elephant Lodge (Sedimothole)',
  'Arathusa Safari Lodge Viewpoint',
  'Moon Garden',
  'Maijane Shooting Stars'
);

-- Rename Nightlife badge to Masuku Night, require 9 nightlife venues
UPDATE public.badges
SET name = 'Masuku Night',
    description = 'Visit 9 nightlife venues: taverns, clubs, lounges, lodges & B&Bs',
    required_checkins = 9,
    icon = '🌙'
WHERE name = 'Nightlife';

-- Update award function to support category-specific badges
CREATE OR REPLACE FUNCTION public.award_badge_if_eligible(p_badge_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_badge RECORD;
  v_count integer;
BEGIN
  SELECT * INTO v_badge FROM badges WHERE id = p_badge_id;
  IF NOT FOUND THEN RETURN; END IF;

  IF v_badge.name = 'Masuku Night' THEN
    SELECT COUNT(DISTINCT c.location_id) INTO v_count
    FROM checkins c
    JOIN locations l ON l.id = c.location_id
    WHERE c.user_id = auth.uid() AND l.category = 'nightlife';
  ELSE
    SELECT COUNT(*) INTO v_count FROM checkins WHERE user_id = auth.uid();
  END IF;

  IF v_badge.required_checkins IS NOT NULL AND v_count >= v_badge.required_checkins THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (auth.uid(), p_badge_id)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$function$;
