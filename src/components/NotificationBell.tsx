import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Notif { id: string; title: string; body: string | null; link: string | null; read_at: string | null; created_at: string }

export function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const unread = items.filter((i) => !i.read_at).length;

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(20);
    setItems((data ?? []) as Notif[]);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel(`notif:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const markAll = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id).is("read_at", null);
    load();
  };

  if (!user) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative rounded-full glass p-2 transition hover:scale-105" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 glass-strong border-primary/20 p-0" align="end">
        <div className="flex items-center justify-between border-b border-white/5 p-3">
          <h3 className="text-sm font-bold">Notifications</h3>
          {unread > 0 && <button onClick={markAll} className="text-xs text-primary hover:underline">Mark all read</button>}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No notifications yet</p>
          ) : items.map((n) => (
            <a key={n.id} href={n.link ?? "#"} className={`block border-b border-white/5 p-3 transition hover:bg-white/5 ${!n.read_at ? "bg-primary/5" : ""}`}>
              <p className="text-sm font-semibold">{n.title}</p>
              {n.body && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
              <p className="mt-1 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
            </a>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
