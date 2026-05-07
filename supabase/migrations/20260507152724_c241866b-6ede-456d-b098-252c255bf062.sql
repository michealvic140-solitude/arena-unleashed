
-- Leaderboard table extras
ALTER TABLE public.leaderboard_factions
  ADD COLUMN IF NOT EXISTS wins int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS losses int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS draws int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS played int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS top_player text;

ALTER TABLE public.leaderboard_players
  ADD COLUMN IF NOT EXISTS wins int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS losses int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS played int NOT NULL DEFAULT 0;

-- Pop-out ad sizing
ALTER TABLE public.advertisements
  ADD COLUMN IF NOT EXISTS size text NOT NULL DEFAULT 'large',
  ADD COLUMN IF NOT EXISTS popout boolean NOT NULL DEFAULT false;

-- Withdrawal requests
DO $$ BEGIN
  CREATE TYPE withdrawal_status AS ENUM ('pending','approved','declined');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ingame_name text NOT NULL,
  gang_name text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  ticket_id text,
  status withdrawal_status NOT NULL DEFAULT 'pending',
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wr user select" ON public.withdrawal_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "wr admin update" ON public.withdrawal_requests FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

-- RPC: submit (deducts immediately)
CREATE OR REPLACE FUNCTION public.submit_withdrawal(_ingame text, _gang text, _amount numeric, _ticket text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); bal numeric; rid uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  SELECT token_balance INTO bal FROM public.profiles WHERE id = uid FOR UPDATE;
  IF bal < _amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
  UPDATE public.profiles SET token_balance = token_balance - _amount, updated_at = now() WHERE id = uid;
  INSERT INTO public.withdrawal_requests (user_id, ingame_name, gang_name, amount, ticket_id)
    VALUES (uid, _ingame, _gang, _amount, _ticket) RETURNING id INTO rid;
  INSERT INTO public.transactions (user_id, type, amount, balance_after, reference_id, note)
    VALUES (uid, 'admin_adjust', -_amount, bal - _amount, rid, 'Withdrawal request submitted');
  INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (uid, 'Withdrawal requested', _amount || ' tokens pending approval', '/dashboard');
  RETURN rid;
END $$;
REVOKE EXECUTE ON FUNCTION public.submit_withdrawal(text,text,numeric,text) FROM anon;

-- RPC: approve
CREATE OR REPLACE FUNCTION public.approve_withdrawal(_req_id uuid, _note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE admin_uid uuid := auth.uid(); r record;
BEGIN
  IF NOT public.is_admin(admin_uid) THEN RAISE EXCEPTION 'Admin only'; END IF;
  SELECT * INTO r FROM public.withdrawal_requests WHERE id = _req_id FOR UPDATE;
  IF r IS NULL OR r.status <> 'pending' THEN RAISE EXCEPTION 'Already reviewed or not found'; END IF;
  UPDATE public.withdrawal_requests SET status='approved', admin_note=_note, reviewed_by=admin_uid, reviewed_at=now() WHERE id=_req_id;
  INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (r.user_id, 'Withdrawal approved', COALESCE(_note,'You will receive your withdrawal within 24hrs. Stay tuned for instructions.'), '/dashboard');
  INSERT INTO public.audit_logs (admin_id, action, target_type, target_id, metadata)
    VALUES (admin_uid, 'withdrawal.approve', 'withdrawal_request', _req_id, jsonb_build_object('amount', r.amount));
END $$;
REVOKE EXECUTE ON FUNCTION public.approve_withdrawal(uuid,text) FROM anon;

-- RPC: decline (refunds)
CREATE OR REPLACE FUNCTION public.decline_withdrawal(_req_id uuid, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE admin_uid uuid := auth.uid(); r record; bal numeric;
BEGIN
  IF NOT public.is_admin(admin_uid) THEN RAISE EXCEPTION 'Admin only'; END IF;
  SELECT * INTO r FROM public.withdrawal_requests WHERE id = _req_id FOR UPDATE;
  IF r IS NULL OR r.status <> 'pending' THEN RAISE EXCEPTION 'Already reviewed or not found'; END IF;
  SELECT token_balance INTO bal FROM public.profiles WHERE id = r.user_id FOR UPDATE;
  UPDATE public.profiles SET token_balance = token_balance + r.amount, updated_at=now() WHERE id = r.user_id;
  UPDATE public.withdrawal_requests SET status='declined', admin_note=_note, reviewed_by=admin_uid, reviewed_at=now() WHERE id=_req_id;
  INSERT INTO public.transactions (user_id, type, amount, balance_after, reference_id, note)
    VALUES (r.user_id, 'admin_adjust', r.amount, bal + r.amount, _req_id, 'Withdrawal declined: '||COALESCE(_note,''));
  INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (r.user_id, 'Withdrawal declined', COALESCE(_note,'Your withdrawal was declined and refunded.'), '/dashboard');
  INSERT INTO public.audit_logs (admin_id, action, target_type, target_id, metadata)
    VALUES (admin_uid, 'withdrawal.decline', 'withdrawal_request', _req_id, jsonb_build_object('amount', r.amount, 'reason', _note));
END $$;
REVOKE EXECUTE ON FUNCTION public.decline_withdrawal(uuid,text) FROM anon;

-- Cashout restriction: only after all selected matches ended (winning-only)
CREATE OR REPLACE FUNCTION public.cashout_bet(_bet_id uuid, _fraction numeric DEFAULT 1)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid(); b record; pay numeric; bal numeric; any_open boolean; any_loss boolean;
BEGIN
  IF _fraction IS NULL OR _fraction <= 0 OR _fraction > 1 THEN RAISE EXCEPTION 'Fraction must be in (0,1]'; END IF;
  SELECT * INTO b FROM public.bets WHERE id = _bet_id FOR UPDATE;
  IF b IS NULL THEN RAISE EXCEPTION 'Bet not found'; END IF;
  IF b.user_id <> uid THEN RAISE EXCEPTION 'Not your bet'; END IF;
  IF b.status <> 'open' THEN RAISE EXCEPTION 'Bet is not open'; END IF;
  -- All matches in this bet must be ended; none lost
  SELECT bool_or(m.status <> 'ended'), bool_or(bs.status = 'lost')
    INTO any_open, any_loss
    FROM public.bet_selections bs JOIN public.matches m ON m.id = bs.match_id
    WHERE bs.bet_id = _bet_id;
  IF any_open THEN RAISE EXCEPTION 'Cashout available only after all selected matches end'; END IF;
  IF any_loss THEN RAISE EXCEPTION 'Cashout only available on winning bets'; END IF;
  pay := round(b.potential_payout * _fraction, 2);
  SELECT token_balance INTO bal FROM public.profiles WHERE id = uid FOR UPDATE;
  UPDATE public.profiles SET token_balance = token_balance + pay, updated_at = now() WHERE id = uid;
  IF _fraction = 1 THEN
    UPDATE public.bets SET status = 'cashed_out', cashout_amount = pay, payout = pay, settled_at = now() WHERE id = _bet_id;
  ELSE
    UPDATE public.bets SET cashout_amount = COALESCE(cashout_amount,0) + pay,
      potential_payout = round(b.potential_payout * (1-_fraction),2) WHERE id = _bet_id;
  END IF;
  INSERT INTO public.transactions (user_id, type, amount, balance_after, reference_id, note)
    VALUES (uid, 'cashout', pay, bal + pay, _bet_id, CASE WHEN _fraction=1 THEN 'Full cashout' ELSE 'Partial cashout' END);
  RETURN pay;
END $$;
REVOKE EXECUTE ON FUNCTION public.cashout_bet(uuid, numeric) FROM anon;
