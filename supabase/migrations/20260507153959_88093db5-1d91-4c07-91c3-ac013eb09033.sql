ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS max_uses_per_user integer NOT NULL DEFAULT 1;

ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS notification_triggers jsonb NOT NULL DEFAULT '{"matches":true,"events":true,"announcements":true,"advertisements":true,"tickets":true,"bets":true}'::jsonb;

CREATE OR REPLACE FUNCTION public.insert_notification_all(_title text, _body text DEFAULT NULL, _link text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, link)
  SELECT id, _title, _body, _link
  FROM public.profiles
  WHERE COALESCE(is_banned, false) = false;
END $$;

CREATE OR REPLACE FUNCTION public.admin_clear_all_tokens(_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_uid uuid := auth.uid();
BEGIN
  IF NOT public.is_admin(admin_uid) THEN RAISE EXCEPTION 'Admin only'; END IF;
  IF COALESCE(length(trim(_reason)), 0) < 5 THEN RAISE EXCEPTION 'Reason required'; END IF;

  INSERT INTO public.transactions (user_id, type, amount, balance_after, note)
  SELECT id, 'admin_adjust', -token_balance, 0, 'Emergency token clear: ' || _reason
  FROM public.profiles
  WHERE token_balance > 0;

  UPDATE public.profiles SET token_balance = 0, updated_at = now() WHERE token_balance <> 0;

  PERFORM public.insert_notification_all('Emergency token reset', _reason, '/dashboard');

  INSERT INTO public.audit_logs (admin_id, action, target_type, metadata)
  VALUES (admin_uid, 'system.clear_all_tokens', 'profiles', jsonb_build_object('reason', _reason));
END $$;

CREATE OR REPLACE FUNCTION public.redeem_promo(_code text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  p record;
  bal numeric;
  user_uses integer;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO p FROM public.promo_codes WHERE code = upper(_code) FOR UPDATE;
  IF p IS NULL THEN RAISE EXCEPTION 'Invalid code'; END IF;
  IF NOT p.is_active THEN RAISE EXCEPTION 'Code disabled'; END IF;
  IF p.expires_at IS NOT NULL AND p.expires_at < now() THEN RAISE EXCEPTION 'Code expired'; END IF;
  IF p.uses >= p.max_uses THEN RAISE EXCEPTION 'Code fully redeemed'; END IF;
  SELECT count(*) INTO user_uses FROM public.promo_redemptions WHERE promo_id = p.id AND user_id = uid;
  IF user_uses >= COALESCE(p.max_uses_per_user, 1) THEN
    RAISE EXCEPTION 'You reached your redemption limit for this code';
  END IF;
  SELECT token_balance INTO bal FROM public.profiles WHERE id = uid FOR UPDATE;
  UPDATE public.profiles SET token_balance = token_balance + p.amount, updated_at = now() WHERE id = uid;
  UPDATE public.promo_codes SET uses = uses + 1 WHERE id = p.id;
  INSERT INTO public.promo_redemptions (promo_id, user_id, amount) VALUES (p.id, uid, p.amount);
  INSERT INTO public.transactions (user_id, type, amount, balance_after, note)
    VALUES (uid, 'token_grant', p.amount, bal + p.amount, 'Promo code: ' || p.code);
  INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (uid, 'Promo redeemed', p.amount || ' tokens added', '/dashboard');
  RETURN p.amount;
END $$;

CREATE OR REPLACE FUNCTION public.settle_match(_match_id uuid, _winner text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_uid uuid := auth.uid();
  bet record;
  win_sel text;
  any_loss boolean;
  any_open boolean;
  payout numeric;
  bal numeric;
  match_title text;
BEGIN
  IF NOT public.is_admin(admin_uid) THEN RAISE EXCEPTION 'Admin only'; END IF;
  IF _winner NOT IN ('home','away','draw') THEN RAISE EXCEPTION 'winner must be home|away|draw'; END IF;
  win_sel := CASE _winner WHEN 'home' THEN '1' WHEN 'draw' THEN 'X' ELSE '2' END;

  SELECT ht.name || ' vs ' || at.name INTO match_title
  FROM public.matches m
  JOIN public.teams ht ON ht.id = m.home_team_id
  JOIN public.teams at ON at.id = m.away_team_id
  WHERE m.id = _match_id;

  UPDATE public.matches SET status='ended', winner=_winner, ended_at=now(), bookings_locked=true WHERE id=_match_id;
  UPDATE public.bet_selections SET status =
    CASE WHEN market='1X2' AND selection=win_sel THEN 'won'
         WHEN market='1X2' THEN 'lost'
         ELSE status END
   WHERE match_id=_match_id;

  FOR bet IN SELECT b.* FROM public.bets b WHERE b.status='open' AND b.id IN (SELECT bet_id FROM public.bet_selections WHERE match_id=_match_id) LOOP
    SELECT bool_or(status='lost'), bool_or(status='open') INTO any_loss, any_open FROM public.bet_selections WHERE bet_id=bet.id;
    IF any_loss THEN
      UPDATE public.bets SET status='lost', payout=0, settled_at=now() WHERE id=bet.id;
      INSERT INTO public.notifications (user_id, title, body, link)
        VALUES (bet.user_id, 'Bet lost', COALESCE(match_title, 'Match') || ' has ended. Your ticket did not win.', '/dashboard');
    ELSIF NOT any_open THEN
      payout := bet.potential_payout;
      SELECT token_balance INTO bal FROM public.profiles WHERE id=bet.user_id FOR UPDATE;
      UPDATE public.profiles SET token_balance = token_balance + payout, updated_at=now() WHERE id=bet.user_id;
      UPDATE public.bets SET status='won', payout=payout, settled_at=now() WHERE id=bet.id;
      INSERT INTO public.transactions (user_id, type, amount, balance_after, reference_id, note)
        VALUES (bet.user_id, 'bet_payout', payout, bal+payout, bet.id, 'Bet won');
      INSERT INTO public.notifications (user_id, title, body, link)
        VALUES (bet.user_id, 'Bet won', payout || ' tokens added to your wallet.', '/dashboard');
    END IF;
  END LOOP;

  PERFORM public.insert_notification_all('Match ended', COALESCE(match_title, 'A match') || ' result has been declared.', '/match/' || _match_id::text);
  INSERT INTO public.audit_logs (admin_id, action, target_type, target_id, metadata)
    VALUES (admin_uid, 'match.settle', 'match', _match_id, jsonb_build_object('winner', _winner));
END $$;

CREATE OR REPLACE FUNCTION public.notify_match_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  title text;
  match_title text;
  enabled boolean;
BEGIN
  SELECT COALESCE((notification_triggers->>'matches')::boolean, true) INTO enabled FROM public.platform_settings WHERE id = 1;
  IF NOT enabled THEN RETURN NEW; END IF;

  SELECT ht.name || ' vs ' || at.name INTO match_title
  FROM public.teams ht, public.teams at
  WHERE ht.id = NEW.home_team_id AND at.id = NEW.away_team_id;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.insert_notification_all('New match created', COALESCE(match_title, 'A new match') || ' is available for booking.', '/match/' || NEW.id::text);
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    title := CASE NEW.status WHEN 'live' THEN 'Match is now live' WHEN 'ended' THEN 'Match ended' ELSE 'Match updated' END;
    PERFORM public.insert_notification_all(title, COALESCE(match_title, 'A match') || ' status is now ' || NEW.status::text || '.', '/match/' || NEW.id::text);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_match_changes ON public.matches;
CREATE TRIGGER trg_notify_match_changes
AFTER INSERT OR UPDATE OF status ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.notify_match_changes();

CREATE OR REPLACE FUNCTION public.notify_content_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  enabled boolean;
  link text := '/';
  nice text;
BEGIN
  SELECT COALESCE((notification_triggers->>TG_TABLE_NAME)::boolean, true) INTO enabled FROM public.platform_settings WHERE id = 1;
  IF NOT enabled THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.is_active = true AND OLD.is_active IS DISTINCT FROM NEW.is_active) THEN
    nice := CASE TG_TABLE_NAME
      WHEN 'events' THEN 'Upcoming event'
      WHEN 'announcements' THEN 'Announcement'
      WHEN 'advertisements' THEN 'Advertisement'
      ELSE 'Platform update'
    END;
    PERFORM public.insert_notification_all(nice || ' posted', COALESCE(NEW.title, 'New content is available.'), link);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_events ON public.events;
CREATE TRIGGER trg_notify_events AFTER INSERT OR UPDATE OF is_active ON public.events FOR EACH ROW EXECUTE FUNCTION public.notify_content_changes();
DROP TRIGGER IF EXISTS trg_notify_announcements ON public.announcements;
CREATE TRIGGER trg_notify_announcements AFTER INSERT OR UPDATE OF is_active ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.notify_content_changes();
DROP TRIGGER IF EXISTS trg_notify_ads ON public.advertisements;
CREATE TRIGGER trg_notify_ads AFTER INSERT OR UPDATE OF is_active ON public.advertisements FOR EACH ROW EXECUTE FUNCTION public.notify_content_changes();