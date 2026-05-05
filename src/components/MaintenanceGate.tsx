import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

/**
 * Blocks the entire app with a glassmorphism notice when admin enables maintenance mode.
 * Admin and the /login & /admin routes stay reachable.
 */
export function MaintenanceGate({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  const loc = useLocation();
  const [maint, setMaint] = useState(false);
  const [msg, setMsg] = useState("We are upgrading the arena. Back in a few hours.");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data } = await supabase.from("platform_settings").select("maintenance_mode, maintenance_message").eq("id", 1).maybeSingle();
      if (!alive || !data) return;
      setMaint(!!data.maintenance_mode);
      if (data.maintenance_message) setMsg(data.maintenance_message);
    };
    load();
    const ch = supabase
      .channel("ps-gate")
      .on("postgres_changes", { event: "*", schema: "public", table: "platform_settings" }, load)
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, []);

  const allow = isAdmin || loc.pathname === "/login" || loc.pathname.startsWith("/admin") || loc.pathname === "/reset-password";

  if (!maint || allow) return <>{children}</>;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-20">
      <div className="glass-strong max-w-lg rounded-2xl p-8 text-center border-accent/30">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-gradient shadow-[var(--shadow-gold)]">
          <Wrench className="h-8 w-8 text-accent-foreground" />
        </div>
        <h1 className="text-2xl font-black brand">Arena under maintenance</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{msg}</p>
        <p className="mt-4 text-xs text-muted-foreground">Thank you for your patience — LOMITA SHOOTERS LEAGUE.</p>
      </div>
    </div>
  );
}