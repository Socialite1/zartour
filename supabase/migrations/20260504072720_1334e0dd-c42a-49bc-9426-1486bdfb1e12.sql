REVOKE EXECUTE ON FUNCTION public.claim_daily_login_bonus() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_daily_login_bonus() TO authenticated;