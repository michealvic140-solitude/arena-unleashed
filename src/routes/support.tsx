import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoy, Sparkles } from "lucide-react";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Support — SHOOTERS BET" }] }),
  component: SupportPage,
});

function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="glass-strong rounded-2xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-gradient shadow-[var(--shadow-gold)]">
          <LifeBuoy className="h-7 w-7 text-accent-foreground" />
        </div>
        <h1 className="text-3xl font-black brand">Support</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          AI-powered support assistant is coming in the next update — it will help you with bookings, today's matches, suggest odds, request tokens, and escalate to admin when needed.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full glass-gold px-4 py-2 text-sm font-bold text-gold">
          <Sparkles className="h-4 w-4" /> Coming next turn
        </div>
      </div>
    </div>
  );
}
