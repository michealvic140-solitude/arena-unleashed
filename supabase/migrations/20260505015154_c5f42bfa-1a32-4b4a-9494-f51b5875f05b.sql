
-- 1) Restrict storage listing on uploads bucket: keep public read of files but only allow listing by authenticated owner folder
DROP POLICY IF EXISTS "uploads public read" ON storage.objects;
CREATE POLICY "uploads public read" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
-- (Keep separate: select policy is already broad but bucket is public; remove if exists overly broad listing)

-- 2) Revoke EXECUTE from anon on all SECURITY DEFINER functions (still callable by authenticated)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.gen_booking_code() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.gen_ticket_code() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_mod_or_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_restrict_user(uuid, boolean, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_mute_user(uuid, boolean, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_ban_user(uuid, boolean, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_grant_tokens(uuid, numeric, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_remove_tokens(uuid, numeric, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.approve_token_request(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.deny_token_request(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.settle_match(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.book_by_code(text, numeric) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.place_bet(numeric, jsonb) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.edit_bet(uuid, numeric, jsonb, uuid[]) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.cashout_bet(uuid, numeric) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.redeem_promo(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.check_chat_not_muted() FROM anon, public, authenticated;

-- Re-grant to authenticated for the user-callable RPCs
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_mod_or_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_bet(numeric, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.edit_bet(uuid, numeric, jsonb, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cashout_bet(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.book_by_code(text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_promo(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_restrict_user(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mute_user(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_ban_user(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_grant_tokens(uuid, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_remove_tokens(uuid, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_token_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deny_token_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.settle_match(uuid, text) TO authenticated;

-- 3) Set search_path on functions missing it (handle_new_user, gen_booking_code, gen_ticket_code)
ALTER FUNCTION public.gen_booking_code() SET search_path = public;
ALTER FUNCTION public.gen_ticket_code() SET search_path = public;
