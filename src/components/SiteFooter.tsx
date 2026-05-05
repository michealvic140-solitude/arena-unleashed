import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Phone, MessageCircle, Send, ShieldCheck, Crosshair } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Settings {
  about_us: string | null;
  why_trust_us: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  contact_sms: string | null;
}

export function SiteFooter() {
  const [s, setS] = useState<Settings | null>(null);
  useEffect(() => {
    supabase
      .from("platform_settings")
      .select("about_us, why_trust_us, contact_email, contact_phone, contact_whatsapp, contact_sms")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => setS(data as Settings | null));
  }, []);

  return (
    <footer className="mt-12 border-t border-white/5 bg-background/40 backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-gradient">
              <Crosshair className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="font-black brand">LOMITA SHOOTERS LEAGUE</span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
            Luxury virtual-token sports betting arena. Play smart. No mercy. Only glory.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-accent">About Us</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {s?.about_us || "LOMITA SHOOTERS LEAGUE is a competitive virtual-token betting arena where gangs and factions clash for glory."}
          </p>
        </div>
        <div>
          <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-accent">
            <ShieldCheck className="h-3.5 w-3.5" /> Why Trust Us
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {s?.why_trust_us || "Transparent settlements, audited admin actions, RLS-secured wallet, real-time payouts, and 24/7 AI + human support."}
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-accent">Contact Us</h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            {s?.contact_email && <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-primary" /> <a href={`mailto:${s.contact_email}`} className="hover:text-foreground">{s.contact_email}</a></li>}
            {s?.contact_phone && <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-primary" /> <a href={`tel:${s.contact_phone}`} className="hover:text-foreground">{s.contact_phone}</a></li>}
            {s?.contact_whatsapp && <li className="flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5 text-primary" /> WhatsApp: {s.contact_whatsapp}</li>}
            {s?.contact_sms && <li className="flex items-center gap-2"><Send className="h-3.5 w-3.5 text-primary" /> SMS: {s.contact_sms}</li>}
            {!s?.contact_email && !s?.contact_phone && !s?.contact_whatsapp && !s?.contact_sms && (
              <li className="italic">Contact details coming soon.</li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-[11px] text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} LOMITA SHOOTERS LEAGUE. All rights reserved.</span>
          <div className="flex items-center gap-3">
            <Link to="/terms" className="hover:text-foreground hover:underline">Terms & Conditions</Link>
            <Link to="/support" className="hover:text-foreground hover:underline">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}