-- Award 5 points on account creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, points)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 5);
  RETURN NEW;
END;
$function$;

-- Backfill existing users who still have 0 points and no checkins
UPDATE public.profiles
SET points = 5
WHERE points = 0
  AND user_id NOT IN (SELECT DISTINCT user_id FROM public.checkins);

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
END $$;