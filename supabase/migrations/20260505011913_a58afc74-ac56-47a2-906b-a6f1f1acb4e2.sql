
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin','moderator','gang_leader','shooter','registered','viewer');
CREATE TYPE public.token_request_status AS ENUM ('pending','approved','denied');
CREATE TYPE public.transaction_type AS ENUM ('grant','request_approved','bet_placed','bet_stake','bet_won','bet_payout','bet_refund','bet_edit','cashout','adjustment','admin_adjust','token_grant','promo','penalty');
CREATE TYPE public.match_status AS ENUM ('upcoming','live','ended','cancelled');
CREATE TYPE public.squad_type AS ENUM ('main','sub');
CREATE TYPE public.bet_status AS ENUM ('open','won','lost','cashed_out','void');
CREATE TYPE public.chat_channel_type AS ENUM ('general','gang','moderator');
CREATE TYPE public.ticket_status AS ENUM ('open','closed','reported');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  discord_username TEXT,
  server TEXT NOT NULL DEFAULT 'LOMITA AFR',
  token_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  avatar_url TEXT,
  country text,
  gang_faction text,
  gang_type text CHECK (gang_type IN ('G','F')) DEFAULT NULL,
  is_banned boolean NOT NULL DEFAULT false,
  ban_reason text,
  banned_at timestamptz,
  is_muted boolean NOT NULL DEFAULT false,
  mute_reason text,
  is_restricted boolean NOT NULL DEFAULT false,
  restrict_reason text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role='admin') $$;

CREATE OR REPLACE FUNCTION public.is_mod_or_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role IN ('admin','moderator')) $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, discord_username, server, country, gang_faction, gang_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email,''),'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'discord_username',
    COALESCE(NEW.raw_user_meta_data->>'server','LOMITA AFR'),
    NEW.raw_user_meta_data->>'country',
    NEW.raw_user_meta_data->>'gang_faction',
    NULLIF(NEW.raw_user_meta_data->>'gang_type','')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'viewer');
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.token_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  note TEXT, image_url TEXT,
  status token_request_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID, reviewed_at TIMESTAMPTZ, admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.token_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  balance_after NUMERIC(14,2) NOT NULL,
  reference_id UUID, note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, short_name TEXT, country TEXT, logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  away_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  league TEXT, kickoff_time TIMESTAMPTZ NOT NULL,
  status match_status NOT NULL DEFAULT 'upcoming',
  home_score INT NOT NULL DEFAULT 0, away_score INT NOT NULL DEFAULT 0,
  winner TEXT, match_minute INT, ended_at TIMESTAMPTZ,
  location text, bookings_locked boolean NOT NULL DEFAULT false, image_url text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.match_categories (
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (match_id, category_id)
);
ALTER TABLE public.match_categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL, jersey_number INT, position TEXT,
  squad_type squad_type NOT NULL DEFAULT 'main',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.odds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  market TEXT NOT NULL, selection TEXT NOT NULL,
  value NUMERIC(8,2) NOT NULL CHECK (value > 1),
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (match_id, market, selection)
);
ALTER TABLE public.odds ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.live_score_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  minute INT, event_type TEXT NOT NULL,
  team_id UUID REFERENCES public.teams(id), description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.live_score_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stake NUMERIC(14,2) NOT NULL CHECK (stake > 0),
  total_odds NUMERIC(10,2) NOT NULL,
  potential_payout NUMERIC(14,2) NOT NULL,
  status bet_status NOT NULL DEFAULT 'open',
  payout NUMERIC(14,2), cashout_amount NUMERIC(14,2),
  booking_code TEXT UNIQUE, ticket_code text, selection_hash text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), settled_at TIMESTAMPTZ
);
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX bets_user_selection_open_uniq ON public.bets(user_id, selection_hash) WHERE status = 'open';

CREATE TABLE public.bet_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id UUID NOT NULL REFERENCES public.bets(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE RESTRICT,
  market TEXT NOT NULL, selection TEXT NOT NULL,
  odds_value NUMERIC(8,2) NOT NULL,
  status bet_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bet_selections ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL, action TEXT NOT NULL,
  target_type TEXT, target_id UUID, metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type chat_channel_type NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT, image_url TEXT, deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

INSERT INTO public.chat_channels (name, type) VALUES
  ('General','general'),('Gang Leaders','gang'),('Moderators','moderator');

CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status ticket_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), closed_at TIMESTAMPTZ
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT, image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL, body TEXT, link TEXT,
  read_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "profiles self select" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_mod_or_admin(auth.uid()));
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles admin all" ON public.profiles FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "roles read self" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_mod_or_admin(auth.uid()));
CREATE POLICY "roles admin manage" ON public.user_roles FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "tr user select" ON public.token_requests FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "tr user insert" ON public.token_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "tr admin update" ON public.token_requests FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "tx user select" ON public.transactions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "tx admin manage" ON public.transactions FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "cat read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "cat admin" ON public.categories FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "teams read" ON public.teams FOR SELECT USING (true);
CREATE POLICY "teams admin" ON public.teams FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "matches read" ON public.matches FOR SELECT USING (true);
CREATE POLICY "matches admin" ON public.matches FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "mc read" ON public.match_categories FOR SELECT USING (true);
CREATE POLICY "mc admin" ON public.match_categories FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "players read" ON public.players FOR SELECT USING (true);
CREATE POLICY "players admin" ON public.players FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "odds read" ON public.odds FOR SELECT USING (true);
CREATE POLICY "odds admin" ON public.odds FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "lse read" ON public.live_score_events FOR SELECT USING (true);
CREATE POLICY "lse admin" ON public.live_score_events FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "bets user select" ON public.bets FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "bets admin manage" ON public.bets FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "bs user select" ON public.bet_selections FOR SELECT TO authenticated USING (
  EXISTS(SELECT 1 FROM public.bets b WHERE b.id = bet_id AND (b.user_id = auth.uid() OR public.is_admin(auth.uid())))
);
CREATE POLICY "bs admin manage" ON public.bet_selections FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "audit admin read" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "audit admin insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "channels read" ON public.chat_channels FOR SELECT TO authenticated USING (
  type='general'
  OR (type='gang' AND (public.has_role(auth.uid(),'gang_leader') OR public.is_mod_or_admin(auth.uid())))
  OR (type='moderator' AND public.is_mod_or_admin(auth.uid()))
);
CREATE POLICY "chat read" ON public.chat_messages FOR SELECT TO authenticated USING (
  EXISTS(SELECT 1 FROM public.chat_channels c WHERE c.id=channel_id AND (
    c.type='general'
    OR (c.type='gang' AND (public.has_role(auth.uid(),'gang_leader') OR public.is_mod_or_admin(auth.uid())))
    OR (c.type='moderator' AND public.is_mod_or_admin(auth.uid()))
  ))
);
CREATE POLICY "chat insert" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND
  EXISTS(SELECT 1 FROM public.chat_channels c WHERE c.id=channel_id AND (
    c.type='general'
    OR (c.type='gang' AND (public.has_role(auth.uid(),'gang_leader') OR public.is_mod_or_admin(auth.uid())))
    OR (c.type='moderator' AND public.is_mod_or_admin(auth.uid()))
  ))
);
CREATE POLICY "chat mod delete" ON public.chat_messages FOR UPDATE TO authenticated USING (public.is_mod_or_admin(auth.uid()));

CREATE POLICY "tk user select" ON public.support_tickets FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_mod_or_admin(auth.uid()));
CREATE POLICY "tk user insert" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "tk mod update" ON public.support_tickets FOR UPDATE TO authenticated USING (public.is_mod_or_admin(auth.uid()) OR user_id=auth.uid());
CREATE POLICY "tk admin delete" ON public.support_tickets FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "tm select" ON public.ticket_messages FOR SELECT TO authenticated USING (
  EXISTS(SELECT 1 FROM public.support_tickets t WHERE t.id=ticket_id AND (t.user_id=auth.uid() OR public.is_mod_or_admin(auth.uid())))
);
CREATE POLICY "tm insert" ON public.ticket_messages FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND
  EXISTS(SELECT 1 FROM public.support_tickets t WHERE t.id=ticket_id AND (t.user_id=auth.uid() OR public.is_mod_or_admin(auth.uid())))
);

CREATE POLICY "notif self" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif update self" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif admin" ON public.notifications FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.odds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_score_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.token_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

INSERT INTO storage.buckets (id, name, public) VALUES ('uploads','uploads', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "uploads public read" ON storage.objects FOR SELECT USING (bucket_id='uploads');
CREATE POLICY "uploads auth insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "uploads owner update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id='uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "uploads owner delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id='uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- AI tables
CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text,
  ticket_id uuid,
  escalated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai conv self" ON public.ai_conversations FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system','tool')),
  content text, metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai msg select" ON public.ai_messages FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND (c.user_id = auth.uid() OR public.is_admin(auth.uid()))));
CREATE POLICY "ai msg insert" ON public.ai_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS(SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND (c.user_id = auth.uid() OR public.is_admin(auth.uid()))));

CREATE TABLE public.ai_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  conversation_id uuid REFERENCES public.ai_conversations(id) ON DELETE SET NULL,
  ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  reason text NOT NULL, ai_summary text, ai_suggestion text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','resolved')),
  admin_reply text, admin_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(), resolved_at timestamptz
);
ALTER TABLE public.ai_escalations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai esc user select" ON public.ai_escalations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_mod_or_admin(auth.uid()));
CREATE POLICY "ai esc user insert" ON public.ai_escalations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "ai esc admin update" ON public.ai_escalations FOR UPDATE TO authenticated
  USING (public.is_mod_or_admin(auth.uid()));

CREATE TABLE public.ai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid, conversation_id uuid, ticket_id uuid,
  kind text NOT NULL, model text,
  prompt_tokens int, completion_tokens int,
  prompt_preview text, response_preview text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ailog admin read" ON public.ai_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "ailog insert any" ON public.ai_logs FOR INSERT TO authenticated WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_escalations;

-- CMS-ish tables
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, description text, image_url text,
  countdown_to timestamptz, is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events read" ON public.events FOR SELECT USING (is_active);
CREATE POLICY "events admin" ON public.events FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text, description text, image_url text, link text,
  is_active boolean NOT NULL DEFAULT true, sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ann read" ON public.announcements FOR SELECT USING (is_active);
CREATE POLICY "ann admin" ON public.announcements FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE TABLE public.advertisements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, description text, image_url text, link text,
  match_id uuid, is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ad read" ON public.advertisements FOR SELECT USING (is_active);
CREATE POLICY "ad admin" ON public.advertisements FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE TABLE public.leaderboard_factions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rank int NOT NULL, name text NOT NULL,
  type text NOT NULL CHECK (type IN ('G','F')),
  score numeric NOT NULL DEFAULT 0, notes text,
  week_start date NOT NULL DEFAULT date_trunc('week', now())::date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leaderboard_factions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lbf read" ON public.leaderboard_factions FOR SELECT USING (true);
CREATE POLICY "lbf admin" ON public.leaderboard_factions FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE TABLE public.leaderboard_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rank int NOT NULL, player_name text NOT NULL,
  gang_or_faction text, gf_type text CHECK (gf_type IN ('G','F')),
  score numeric NOT NULL DEFAULT 0, player_role text,
  week_start date NOT NULL DEFAULT date_trunc('week', now())::date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leaderboard_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lbp read" ON public.leaderboard_players FOR SELECT USING (true);
CREATE POLICY "lbp admin" ON public.leaderboard_players FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE TABLE public.live_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid, custom_title text, custom_subtitle text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.live_highlights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lh read" ON public.live_highlights FOR SELECT USING (is_active);
CREATE POLICY "lh admin" ON public.live_highlights FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE TABLE public.platform_settings (
  id int PRIMARY KEY DEFAULT 1,
  maintenance_mode boolean NOT NULL DEFAULT false,
  maintenance_message text DEFAULT 'We are upgrading the arena. Back in a few hours.',
  max_payout numeric NOT NULL DEFAULT 60000000,
  min_stake numeric NOT NULL DEFAULT 2000000,
  max_stake numeric NOT NULL DEFAULT 20000000,
  contact_email text, contact_phone text, contact_whatsapp text, contact_sms text,
  about_us text, why_trust_us text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT singleton CHECK (id = 1)
);
INSERT INTO public.platform_settings (id) VALUES (1);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ps read" ON public.platform_settings FOR SELECT TO public USING (true);
CREATE POLICY "ps admin" ON public.platform_settings FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.terms_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL, title text NOT NULL, body text NOT NULL,
  sort_order int NOT NULL DEFAULT 0, is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.terms_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ts read" ON public.terms_sections FOR SELECT TO public USING (is_active);
CREATE POLICY "ts admin" ON public.terms_sections FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE, amount numeric NOT NULL,
  max_uses int NOT NULL DEFAULT 1, uses int NOT NULL DEFAULT 0,
  expires_at timestamptz, is_active boolean NOT NULL DEFAULT true,
  note text, created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pc admin" ON public.promo_codes FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id uuid NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL, amount numeric NOT NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(promo_id, user_id)
);
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pr admin" ON public.promo_redemptions FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "pr self read" ON public.promo_redemptions FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('ban','mute','restrict','other')),
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  admin_reply text,
  created_at timestamptz NOT NULL DEFAULT now(), resolved_at timestamptz
);
ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ap user insert" ON public.appeals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "ap user select" ON public.appeals FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_mod_or_admin(auth.uid()));
CREATE POLICY "ap admin update" ON public.appeals FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.advertisements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard_factions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_highlights;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;

-- RPC FUNCTIONS
CREATE OR REPLACE FUNCTION public.gen_booking_code() RETURNS text
LANGUAGE plpgsql AS $$
DECLARE c text;
BEGIN
  LOOP
    c := upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.bets WHERE booking_code = c);
  END LOOP;
  RETURN c;
END $$;

CREATE OR REPLACE FUNCTION public.gen_ticket_code() RETURNS text
LANGUAGE plpgsql AS $$
DECLARE n int; c text;
BEGIN
  LOOP
    SELECT count(*)+1 INTO n FROM public.bets;
    c := 'LSL' || lpad(n::text, 4, '0') || upper(substr(md5(gen_random_uuid()::text),1,3));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.bets WHERE ticket_code = c);
  END LOOP;
  RETURN c;
END $$;

CREATE OR REPLACE FUNCTION public.place_bet(_stake numeric, _selections jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  bal numeric;
  total_odds numeric := 1;
  payout numeric;
  bet_id uuid;
  sel jsonb;
  count_sel int;
  locked boolean;
  prof record;
  cap numeric;
  hash text;
  s text := '';
  maint boolean;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT maintenance_mode, max_payout INTO maint, cap FROM public.platform_settings WHERE id=1;
  IF maint THEN RAISE EXCEPTION 'Platform is under maintenance'; END IF;
  SELECT * INTO prof FROM public.profiles WHERE id = uid FOR UPDATE;
  IF prof.is_banned THEN RAISE EXCEPTION 'Account banned: %', COALESCE(prof.ban_reason,''); END IF;
  IF prof.is_restricted THEN RAISE EXCEPTION 'Account restricted: %', COALESCE(prof.restrict_reason,''); END IF;
  IF _stake IS NULL OR _stake <= 0 THEN RAISE EXCEPTION 'Invalid stake'; END IF;
  count_sel := jsonb_array_length(_selections);
  IF count_sel = 0 THEN RAISE EXCEPTION 'No selections'; END IF;
  FOR sel IN SELECT * FROM jsonb_array_elements(_selections) ORDER BY (value->>'match_id') LOOP
    s := s || (sel->>'match_id') || '|' || (sel->>'market') || '|' || (sel->>'selection') || ';';
  END LOOP;
  hash := md5(s);
  IF EXISTS (SELECT 1 FROM public.bets WHERE user_id = uid AND selection_hash = hash AND status = 'open') THEN
    RAISE EXCEPTION 'You already have an identical open bet';
  END IF;
  FOR sel IN SELECT * FROM jsonb_array_elements(_selections) LOOP
    SELECT bookings_locked INTO locked FROM public.matches WHERE id = (sel->>'match_id')::uuid;
    IF COALESCE(locked,false) THEN RAISE EXCEPTION 'Bookings closed for one of the selected matches'; END IF;
    total_odds := total_odds * (sel->>'odds_value')::numeric;
  END LOOP;
  bal := prof.token_balance;
  IF bal < _stake THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
  payout := round(_stake * total_odds, 2);
  IF payout > cap THEN payout := cap; END IF;
  UPDATE public.profiles SET token_balance = token_balance - _stake, updated_at = now() WHERE id = uid;
  INSERT INTO public.bets (user_id, stake, total_odds, potential_payout, status, booking_code, ticket_code, selection_hash)
    VALUES (uid, _stake, round(total_odds, 4), payout, 'open', public.gen_booking_code(), public.gen_ticket_code(), hash) RETURNING id INTO bet_id;
  FOR sel IN SELECT * FROM jsonb_array_elements(_selections) LOOP
    INSERT INTO public.bet_selections (bet_id, match_id, market, selection, odds_value)
    VALUES (bet_id, (sel->>'match_id')::uuid, sel->>'market', sel->>'selection', (sel->>'odds_value')::numeric);
  END LOOP;
  INSERT INTO public.transactions (user_id, type, amount, balance_after, reference_id, note)
    VALUES (uid, 'bet_stake', -_stake, bal - _stake, bet_id, 'Bet placed');
  RETURN bet_id;
END $$;

CREATE OR REPLACE FUNCTION public.book_by_code(_code text, _stake numeric)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE src record; sel record; arr jsonb := '[]'::jsonb;
BEGIN
  SELECT * INTO src FROM public.bets WHERE booking_code = upper(_code);
  IF src IS NULL THEN RAISE EXCEPTION 'Booking code not found'; END IF;
  FOR sel IN SELECT * FROM public.bet_selections WHERE bet_id = src.id LOOP
    arr := arr || jsonb_build_object('match_id', sel.match_id, 'market', sel.market, 'selection', sel.selection, 'odds_value', sel.odds_value);
  END LOOP;
  RETURN public.place_bet(_stake, arr);
END $$;

CREATE OR REPLACE FUNCTION public.edit_bet(_bet_id uuid, _new_stake numeric, _add_selections jsonb, _remove_selection_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid(); b record; bal numeric;
  total_odds numeric := 1; payout numeric; diff numeric; sel jsonb; cnt int;
BEGIN
  SELECT * INTO b FROM public.bets WHERE id = _bet_id FOR UPDATE;
  IF b IS NULL THEN RAISE EXCEPTION 'Bet not found'; END IF;
  IF b.user_id <> uid THEN RAISE EXCEPTION 'Not your bet'; END IF;
  IF b.status <> 'open' THEN RAISE EXCEPTION 'Bet is not open'; END IF;
  IF _remove_selection_ids IS NOT NULL AND array_length(_remove_selection_ids,1) > 0 THEN
    DELETE FROM public.bet_selections WHERE bet_id = _bet_id AND id = ANY(_remove_selection_ids);
  END IF;
  IF _add_selections IS NOT NULL AND jsonb_array_length(_add_selections) > 0 THEN
    FOR sel IN SELECT * FROM jsonb_array_elements(_add_selections) LOOP
      INSERT INTO public.bet_selections (bet_id, match_id, market, selection, odds_value)
      VALUES (_bet_id, (sel->>'match_id')::uuid, sel->>'market', sel->>'selection', (sel->>'odds_value')::numeric);
    END LOOP;
  END IF;
  SELECT count(*), COALESCE(exp(sum(ln(odds_value))), 1) INTO cnt, total_odds
    FROM public.bet_selections WHERE bet_id = _bet_id;
  IF cnt = 0 THEN RAISE EXCEPTION 'Bet must have at least one selection'; END IF;
  IF _new_stake IS NOT NULL AND _new_stake <> b.stake THEN
    IF _new_stake <= 0 THEN RAISE EXCEPTION 'Invalid stake'; END IF;
    diff := _new_stake - b.stake;
    SELECT token_balance INTO bal FROM public.profiles WHERE id = uid FOR UPDATE;
    IF diff > 0 AND bal < diff THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
    UPDATE public.profiles SET token_balance = token_balance - diff, updated_at = now() WHERE id = uid;
    INSERT INTO public.transactions (user_id, type, amount, balance_after, reference_id, note)
      VALUES (uid, 'bet_edit', -diff, bal - diff, _bet_id, 'Bet stake adjusted');
  ELSE
    _new_stake := b.stake;
  END IF;
  payout := round(_new_stake * total_odds, 2);
  UPDATE public.bets SET stake = _new_stake, total_odds = round(total_odds,4), potential_payout = payout WHERE id = _bet_id;
END $$;

CREATE OR REPLACE FUNCTION public.cashout_bet(_bet_id uuid, _fraction numeric DEFAULT 1)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid(); b record;
  full_cashout numeric; pay numeric; bal numeric; new_stake numeric;
BEGIN
  IF _fraction IS NULL OR _fraction <= 0 OR _fraction > 1 THEN RAISE EXCEPTION 'Fraction must be in (0,1]'; END IF;
  SELECT * INTO b FROM public.bets WHERE id = _bet_id FOR UPDATE;
  IF b IS NULL THEN RAISE EXCEPTION 'Bet not found'; END IF;
  IF b.user_id <> uid THEN RAISE EXCEPTION 'Not your bet'; END IF;
  IF b.status <> 'open' THEN RAISE EXCEPTION 'Bet is not open'; END IF;
  full_cashout := round(b.stake + (b.potential_payout - b.stake) * 0.5, 2);
  pay := round(full_cashout * _fraction, 2);
  SELECT token_balance INTO bal FROM public.profiles WHERE id = uid FOR UPDATE;
  UPDATE public.profiles SET token_balance = token_balance + pay, updated_at = now() WHERE id = uid;
  IF _fraction = 1 THEN
    UPDATE public.bets SET status = 'cashed_out', cashout_amount = pay, payout = pay, settled_at = now() WHERE id = _bet_id;
  ELSE
    new_stake := round(b.stake * (1 - _fraction), 2);
    UPDATE public.bets SET stake = new_stake, potential_payout = round(new_stake * b.total_odds, 2),
      cashout_amount = COALESCE(cashout_amount,0) + pay WHERE id = _bet_id;
  END IF;
  INSERT INTO public.transactions (user_id, type, amount, balance_after, reference_id, note)
    VALUES (uid, 'cashout', pay, bal + pay, _bet_id, CASE WHEN _fraction = 1 THEN 'Full cashout' ELSE 'Partial cashout' END);
  RETURN pay;
END $$;

CREATE OR REPLACE FUNCTION public.approve_token_request(_req_id uuid, _admin_note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE admin_uid uuid := auth.uid(); r record; bal numeric;
BEGIN
  IF NOT public.is_admin(admin_uid) THEN RAISE EXCEPTION 'Admin only'; END IF;
  SELECT * INTO r FROM public.token_requests WHERE id = _req_id FOR UPDATE;
  IF r IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF r.status <> 'pending' THEN RAISE EXCEPTION 'Already reviewed'; END IF;
  SELECT token_balance INTO bal FROM public.profiles WHERE id = r.user_id FOR UPDATE;
  UPDATE public.profiles SET token_balance = token_balance + r.amount, updated_at = now() WHERE id = r.user_id;
  UPDATE public.token_requests SET status = 'approved', admin_note = _admin_note, reviewed_by = admin_uid, reviewed_at = now() WHERE id = _req_id;
  INSERT INTO public.transactions (user_id, type, amount, balance_after, reference_id, note)
    VALUES (r.user_id, 'token_grant', r.amount, bal + r.amount, _req_id, COALESCE(_admin_note, 'Token request approved'));
  INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (r.user_id, 'Tokens approved', 'Your token request was approved.', '/tokens');
  INSERT INTO public.audit_logs (admin_id, action, target_type, target_id, metadata)
    VALUES (admin_uid, 'token_request.approve', 'token_request', _req_id, jsonb_build_object('amount', r.amount));
END $$;

CREATE OR REPLACE FUNCTION public.deny_token_request(_req_id uuid, _admin_note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE admin_uid uuid := auth.uid(); r record;
BEGIN
  IF NOT public.is_admin(admin_uid) THEN RAISE EXCEPTION 'Admin only'; END IF;
  SELECT * INTO r FROM public.token_requests WHERE id = _req_id FOR UPDATE;
  IF r IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF r.status <> 'pending' THEN RAISE EXCEPTION 'Already reviewed'; END IF;
  UPDATE public.token_requests SET status = 'denied', admin_note = _admin_note, reviewed_by = admin_uid, reviewed_at = now() WHERE id = _req_id;
  INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (r.user_id, 'Tokens denied', COALESCE(_admin_note,'Your token request was denied.'), '/tokens');
  INSERT INTO public.audit_logs (admin_id, action, target_type, target_id, metadata)
    VALUES (admin_uid, 'token_request.deny', 'token_request', _req_id, jsonb_build_object('amount', r.amount, 'note', _admin_note));
END $$;

CREATE OR REPLACE FUNCTION public.admin_grant_tokens(_user_id uuid, _amount numeric, _note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE admin_uid uuid := auth.uid(); bal numeric;
BEGIN
  IF NOT public.is_admin(admin_uid) THEN RAISE EXCEPTION 'Admin only'; END IF;
  IF _amount = 0 THEN RAISE EXCEPTION 'Amount cannot be zero'; END IF;
  SELECT token_balance INTO bal FROM public.profiles WHERE id = _user_id FOR UPDATE;
  IF bal IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;
  UPDATE public.profiles SET token_balance = token_balance + _amount, updated_at = now() WHERE id = _user_id;
  INSERT INTO public.transactions (user_id, type, amount, balance_after, note)
    VALUES (_user_id, CASE WHEN _amount>0 THEN 'token_grant' ELSE 'admin_adjust' END, _amount, bal + _amount, COALESCE(_note,'Admin adjustment'));
  INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (_user_id, CASE WHEN _amount>0 THEN 'Tokens granted' ELSE 'Token adjustment' END, COALESCE(_note,'Admin updated your balance'), '/tokens');
  INSERT INTO public.audit_logs (admin_id, action, target_type, target_id, metadata)
    VALUES (admin_uid, 'tokens.grant', 'profile', _user_id, jsonb_build_object('amount', _amount, 'note', _note));
END $$;

CREATE OR REPLACE FUNCTION public.admin_remove_tokens(_user_id uuid, _amount numeric, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE admin_uid uuid := auth.uid(); bal numeric;
BEGIN
  IF NOT public.is_admin(admin_uid) THEN RAISE EXCEPTION 'Admin only'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  SELECT token_balance INTO bal FROM public.profiles WHERE id=_user_id FOR UPDATE;
  IF bal IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;
  IF bal < _amount THEN RAISE EXCEPTION 'User balance too low'; END IF;
  UPDATE public.profiles SET token_balance = token_balance - _amount, updated_at=now() WHERE id=_user_id;
  INSERT INTO public.transactions (user_id, type, amount, balance_after, note)
    VALUES (_user_id, 'admin_adjust', -_amount, bal - _amount, _reason);
  INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (_user_id, 'Tokens removed', _reason, '/tokens');
  INSERT INTO public.audit_logs (admin_id, action, target_type, target_id, metadata)
    VALUES (admin_uid, 'tokens.remove', 'profile', _user_id, jsonb_build_object('amount', _amount, 'reason', _reason));
END $$;

CREATE OR REPLACE FUNCTION public.settle_match(_match_id uuid, _winner text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  admin_uid uuid := auth.uid();
  bet record; win_sel text; any_loss boolean; any_open boolean;
  payout numeric; bal numeric;
BEGIN
  IF NOT public.is_admin(admin_uid) THEN RAISE EXCEPTION 'Admin only'; END IF;
  IF _winner NOT IN ('home','away','draw') THEN RAISE EXCEPTION 'winner must be home|away|draw'; END IF;
  win_sel := CASE _winner WHEN 'home' THEN '1' WHEN 'draw' THEN 'X' ELSE '2' END;
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
    ELSIF NOT any_open THEN
      payout := bet.potential_payout;
      SELECT token_balance INTO bal FROM public.profiles WHERE id=bet.user_id FOR UPDATE;
      UPDATE public.profiles SET token_balance = token_balance + payout, updated_at=now() WHERE id=bet.user_id;
      UPDATE public.bets SET status='won', payout=payout, settled_at=now() WHERE id=bet.id;
      INSERT INTO public.transactions (user_id, type, amount, balance_after, reference_id, note)
        VALUES (bet.user_id, 'bet_payout', payout, bal+payout, bet.id, 'Bet won');
    END IF;
  END LOOP;
  INSERT INTO public.audit_logs (admin_id, action, target_type, target_id, metadata)
    VALUES (admin_uid, 'match.settle', 'match', _match_id, jsonb_build_object('winner', _winner));
END $$;

CREATE OR REPLACE FUNCTION public.admin_ban_user(_user_id uuid, _ban boolean, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE admin_uid uuid := auth.uid();
BEGIN
  IF NOT public.is_admin(admin_uid) THEN RAISE EXCEPTION 'Admin only'; END IF;
  UPDATE public.profiles SET is_banned=_ban, ban_reason=CASE WHEN _ban THEN _reason ELSE NULL END,
    banned_at=CASE WHEN _ban THEN now() ELSE NULL END WHERE id=_user_id;
  INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (_user_id, CASE WHEN _ban THEN 'Account banned' ELSE 'Ban lifted' END,
      COALESCE(_reason, CASE WHEN _ban THEN 'Your account has been banned.' ELSE 'Welcome back.' END), '/dashboard');
  INSERT INTO public.audit_logs (admin_id, action, target_type, target_id, metadata)
    VALUES (admin_uid, CASE WHEN _ban THEN 'user.ban' ELSE 'user.unban' END, 'profile', _user_id, jsonb_build_object('reason', _reason));
END $$;

CREATE OR REPLACE FUNCTION public.admin_mute_user(_user_id uuid, _mute boolean, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE admin_uid uuid := auth.uid();
BEGIN
  IF NOT public.is_admin(admin_uid) THEN RAISE EXCEPTION 'Admin only'; END IF;
  UPDATE public.profiles SET is_muted=_mute, mute_reason=CASE WHEN _mute THEN _reason ELSE NULL END WHERE id=_user_id;
  INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (_user_id, CASE WHEN _mute THEN 'You were muted' ELSE 'Mute lifted' END, COALESCE(_reason,''), '/dashboard');
  INSERT INTO public.audit_logs (admin_id, action, target_type, target_id, metadata)
    VALUES (admin_uid, CASE WHEN _mute THEN 'user.mute' ELSE 'user.unmute' END, 'profile', _user_id, jsonb_build_object('reason', _reason));
END $$;

CREATE OR REPLACE FUNCTION public.admin_restrict_user(_user_id uuid, _restrict boolean, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE admin_uid uuid := auth.uid();
BEGIN
  IF NOT public.is_admin(admin_uid) THEN RAISE EXCEPTION 'Admin only'; END IF;
  UPDATE public.profiles SET is_restricted=_restrict, restrict_reason=CASE WHEN _restrict THEN _reason ELSE NULL END WHERE id=_user_id;
  INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (_user_id, CASE WHEN _restrict THEN 'Betting restricted' ELSE 'Restriction lifted' END, COALESCE(_reason,''), '/dashboard');
  INSERT INTO public.audit_logs (admin_id, action, target_type, target_id, metadata)
    VALUES (admin_uid, CASE WHEN _restrict THEN 'user.restrict' ELSE 'user.unrestrict' END, 'profile', _user_id, jsonb_build_object('reason', _reason));
END $$;

CREATE OR REPLACE FUNCTION public.redeem_promo(_code text)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); p record; bal numeric;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO p FROM public.promo_codes WHERE code = upper(_code) FOR UPDATE;
  IF p IS NULL THEN RAISE EXCEPTION 'Invalid code'; END IF;
  IF NOT p.is_active THEN RAISE EXCEPTION 'Code disabled'; END IF;
  IF p.expires_at IS NOT NULL AND p.expires_at < now() THEN RAISE EXCEPTION 'Code expired'; END IF;
  IF p.uses >= p.max_uses THEN RAISE EXCEPTION 'Code fully redeemed'; END IF;
  IF EXISTS(SELECT 1 FROM public.promo_redemptions WHERE promo_id=p.id AND user_id=uid) THEN
    RAISE EXCEPTION 'You already redeemed this code';
  END IF;
  SELECT token_balance INTO bal FROM public.profiles WHERE id=uid FOR UPDATE;
  UPDATE public.profiles SET token_balance = token_balance + p.amount, updated_at=now() WHERE id=uid;
  UPDATE public.promo_codes SET uses = uses + 1 WHERE id = p.id;
  INSERT INTO public.promo_redemptions (promo_id, user_id, amount) VALUES (p.id, uid, p.amount);
  INSERT INTO public.transactions (user_id, type, amount, balance_after, note)
    VALUES (uid, 'token_grant', p.amount, bal + p.amount, 'Promo code: ' || p.code);
  INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (uid, 'Promo redeemed', p.amount || ' tokens added', '/dashboard');
  RETURN p.amount;
END $$;

CREATE OR REPLACE FUNCTION public.check_chat_not_muted() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM public.profiles WHERE id = NEW.user_id AND is_muted = true) THEN
    RAISE EXCEPTION 'You are muted and cannot send messages';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER chat_mute_check BEFORE INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.check_chat_not_muted();

INSERT INTO public.terms_sections (category, title, body, sort_order) VALUES
('Account', 'Account Creation', 'You must provide accurate information including country, server, gang/faction. One account per person.', 1),
('Account', 'Account Management', 'Keep your credentials safe. Sharing accounts is forbidden.', 2),
('Betting', 'Placing Bets', 'Minimum stake 2,000,000. Maximum stake 20,000,000. Minimum 3 matches per ticket. Max payout is capped at 60,000,000 tokens regardless of stake/odds.', 1),
('Betting', 'No Refund Policy', 'Once a match has started, no refund is possible. All bets are final.', 2),
('Tokens', 'Token Requests', 'Tokens are virtual. Submit a request with proof. Admin approval is required.', 1),
('Tokens', 'Promo Codes', 'Promo codes can only be redeemed once per user.', 2),
('Chat', 'Texting Rules', 'No harassment, hate speech, or doxxing. Violations result in mute or ban.', 1),
('Security', 'Suspicious Activity', 'Multi-accounting, exploiting bugs, or fraud will result in permanent ban.', 1),
('Security', 'Login Tracking', 'We track logins for security. Unusual activity may temporarily lock your account.', 2);
