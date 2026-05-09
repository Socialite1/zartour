-- Add referral tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by uuid;

-- Update handle_new_user to award referrer 10 points and store referred_by
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_ref uuid;
BEGIN
  BEGIN
    v_ref := NULLIF(NEW.raw_user_meta_data->>'referred_by','')::uuid;
  EXCEPTION WHEN others THEN
    v_ref := NULL;
  END;

  -- Don't allow self-referral
  IF v_ref = NEW.id THEN v_ref := NULL; END IF;

  INSERT INTO public.profiles (user_id, full_name, points, referred_by)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), 5, v_ref);

  IF v_ref IS NOT NULL THEN
    UPDATE public.profiles
    SET points = points + 10
    WHERE user_id = v_ref;
  END IF;

  RETURN NEW;
END;
$function$;

-- Ensure trigger exists on auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END$$;