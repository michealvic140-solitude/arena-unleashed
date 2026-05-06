import { createFileRoute, Link } from "@tanstack/react-router";
import { Wallet, ArrowDownToLine, ArrowUpFromLine, Sparkles, Coins } from "lucide-react";

export const Route = createFileRoute("/wallet")({
  head: () => ({ meta: [{ title: "Wallet — LOMITA SHOOTERS LEAGUE" }] }),
  component: WalletPage,
});

function WalletPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-gradient shadow-[var(--shadow-gold)]">
          <Wallet className="h-6 w-6 text-accent-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-black brand">Wallet</h1>
          <p className="text-sm text-muted-foreground">Real-money deposits & withdrawals</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ComingSoonCard
          icon={<ArrowDownToLine className="h-6 w-6 text-accent-foreground" />}
          title="Deposit real money"
          desc="Securely fund your account using card, bank transfer, or crypto."
        />
        <ComingSoonCard
          icon={<ArrowUpFromLine className="h-6 w-6 text-accent-foreground" />}
          title="Withdraw winnings"
          desc="Cash out your token balance to your preferred payout method."
        />
      </div>

      <div className="mt-6 glass-strong rounded-2xl p-6">
        <h2 className="mb-2 flex items-center gap-2 text-lg font-bold"><Sparkles className="h-4 w-4 text-accent" /> In the meantime</h2>
        <p className="text-sm text-muted-foreground">Use virtual tokens to play, redeem promo codes, or request a token grant from an admin.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/tokens" className="inline-flex items-center gap-1.5 rounded-lg bg-gold-gradient px-4 py-2 text-sm font-bold text-accent-foreground"><Coins className="h-4 w-4" /> Get tokens</Link>
          <Link to="/" className="inline-flex items-center rounded-lg glass px-4 py-2 text-sm font-bold hover:bg-white/10">Browse matches</Link>
        </div>
      </div>
    </div>
  );
}

function ComingSoonCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl glass-strong p-5">
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-accent/15 blur-3xl" />
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-gradient">{icon}</div>
      <h3 className="mt-3 text-lg font-bold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <span className="mt-3 inline-block rounded-full glass-gold px-3 py-1 text-[11px] font-black uppercase tracking-widest text-gold">Coming Soon</span>
    </div>
  );
}
