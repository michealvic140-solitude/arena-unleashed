import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms & Conditions — LOMITA SHOOTERS LEAGUE" }] }),
  component: TermsPage,
});

interface Section { id: string; category: string; title: string; body: string; sort_order: number }

function TermsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  useEffect(() => {
    supabase.from("terms_sections").select("*").eq("is_active", true).order("sort_order").then(({ data }) => {
      setSections((data ?? []) as Section[]);
    });
  }, []);

  const grouped = sections.reduce<Record<string, Section[]>>((acc, s) => {
    (acc[s.category] ||= []).push(s); return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-gradient shadow-[var(--shadow-gold)]">
          <ScrollText className="h-6 w-6 text-accent-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-black brand">Terms & Conditions</h1>
          <p className="text-sm text-muted-foreground">Please read carefully. Continued use means you accept these terms.</p>
        </div>
      </div>
      {Object.entries(grouped).map(([cat, items]) => (
        <section key={cat} className="mb-6 glass-strong rounded-2xl p-5">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-accent">{cat}</h2>
          <div className="space-y-4">
            {items.map((s) => (
              <div key={s.id}>
                <h3 className="font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{s.body}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
      {sections.length === 0 && <div className="glass rounded-xl p-8 text-center text-muted-foreground">No terms published yet.</div>}
    </div>
  );
}