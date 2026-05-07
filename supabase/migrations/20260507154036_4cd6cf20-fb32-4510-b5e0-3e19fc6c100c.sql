REVOKE EXECUTE ON FUNCTION public.insert_notification_all(text,text,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_clear_all_tokens(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_match_changes() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_content_changes() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.redeem_promo(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.settle_match(uuid,text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_clear_all_tokens(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_promo(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.settle_match(uuid,text) TO authenticated;