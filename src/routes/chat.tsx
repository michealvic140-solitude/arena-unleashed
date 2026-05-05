import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Hash, Shield, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat — LOMITA SHOOTERS LEAGUE" },
      { name: "description", content: "Talk strategy, share tips, and rally your gang in real-time chat channels." },
    ],
  }),
  component: ChatPage,
});

interface Channel { id: string; name: string; type: "general" | "gang" | "moderator" }
interface Message { id: string; channel_id: string; user_id: string; content: string | null; image_url: string | null; created_at: string; deleted_at: string | null }

function ChatPage() {
  const { user, profile, isMod, isAdmin, hasRole } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from("chat_channels").select("*").order("name").then(({ data }) => {
      const list = (data ?? []) as Channel[];
      setChannels(list);
      if (list.length && !active) setActive(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!active) return;
    supabase.from("chat_messages").select("*").eq("channel_id", active).is("deleted_at", null).order("created_at", { ascending: true }).limit(200).then(async ({ data }) => {
      const list = (data ?? []) as Message[];
      setMessages(list);
      const ids = Array.from(new Set(list.map((m) => m.user_id)));
      if (ids.length) {
        const { data: ps } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        const map: Record<string, string> = {};
        (ps ?? []).forEach((p: { id: string; full_name: string }) => { map[p.id] = p.full_name; });
        setNames((prev) => ({ ...prev, ...map }));
      }
    });
    const ch = supabase.channel(`chat-${active}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `channel_id=eq.${active}` },
      (payload) => { setMessages((prev) => [...prev, payload.new as Message]); }
    ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [active]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!user || !active || !text.trim()) return;
    if (profile?.is_muted) { toast.error("You are muted"); return; }
    const content = text.trim();
    setText("");
    const { error } = await supabase.from("chat_messages").insert({ channel_id: active, user_id: user.id, content });
    if (error) toast.error(error.message);
  };

  const visibleChannels = channels.filter((c) => {
    if (c.type === "general") return true;
    if (c.type === "moderator") return isMod;
    if (c.type === "gang") return hasRole("gang_leader") || isMod;
    return false;
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="glass-strong rounded-2xl p-8">
          <h1 className="text-xl font-bold">Sign in to chat</h1>
          <p className="mt-2 text-sm text-muted-foreground">Join the conversation with the LSL community.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
        <aside className="glass-strong rounded-2xl p-3">
          <div className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Channels</div>
          <div className="flex flex-col gap-1">
            {visibleChannels.map((c) => (
              <button key={c.id} onClick={() => setActive(c.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${active === c.id ? "bg-gold-gradient text-accent-foreground" : "hover:bg-white/5"}`}>
                {c.type === "general" ? <Hash className="h-3.5 w-3.5" /> : c.type === "moderator" ? <Shield className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                {c.name}
              </button>
            ))}
            {!visibleChannels.length && <p className="px-2 py-4 text-xs text-muted-foreground">No channels available.</p>}
          </div>
        </aside>

        <section className="glass-strong flex h-[70vh] flex-col rounded-2xl">
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {messages.map((m) => (
              <div key={m.id} className="flex gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-gradient text-xs font-bold text-accent-foreground">
                  {(names[m.user_id] ?? "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">{names[m.user_id] ?? "User"}</span> · {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  <div className="break-words text-sm">{m.content}</div>
                </div>
              </div>
            ))}
            {!messages.length && <div className="py-12 text-center text-sm text-muted-foreground">No messages yet. Be the first to say hi.</div>}
            <div ref={endRef} />
          </div>
          <div className="border-t border-white/5 p-3">
            <div className="flex gap-2">
              <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} placeholder={profile?.is_muted ? "You are muted" : "Type a message..."} disabled={profile?.is_muted} />
              <Button onClick={send} disabled={!text.trim()} className="bg-gold-gradient text-accent-foreground"><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </section>
      </div>
      {isAdmin && <p className="mt-3 text-center text-xs text-muted-foreground">Admins/mods can soft-delete messages from the database.</p>}
    </div>
  );
}