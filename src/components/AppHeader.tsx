import { Link, useNavigate } from "@tanstack/react-router";
import { Coins, Crosshair, LifeBuoy, LogIn, LogOut, Menu, Shield, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { formatTokens } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";

export function AppHeader() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 glass-strong border-b border-white/5">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gold-gradient shadow-[var(--shadow-gold)] transition group-hover:scale-105">
            <Crosshair className="h-5 w-5 text-accent-foreground" strokeWidth={2.5} />
          </div>
          <span className="hidden text-sm font-black tracking-tight brand sm:inline">
            LOMITA<span className="ml-1 text-primary">SHOOTERS</span><span className="ml-1">LEAGUE</span>
          </span>
          <span className="text-base font-black brand sm:hidden">LSL</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          <NavLink to="/">Sports</NavLink>
          <NavLink to="/live">Live</NavLink>
          <NavLink to="/dashboard">My Bets</NavLink>
          <NavLink to="/tokens">Tokens</NavLink>
          <NavLink to="/chat">Chat</NavLink>
          <NavLink to="/support">Support</NavLink>
          <NavLink to="/terms">Terms</NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link to="/tokens" className="hidden items-center gap-1.5 rounded-lg glass-gold px-3 py-1.5 text-sm font-bold transition hover:scale-[1.02] sm:flex">
                <Coins className="h-4 w-4 text-accent" />
                <span className="tabular-nums text-gold">{formatTokens(profile?.token_balance ?? 0)}</span>
              </Link>
              <NotificationBell />
              {isAdmin && (
                <Link to="/admin" className="hidden md:block">
                  <Button size="sm" variant="outline" className="gap-1 border-primary/40 text-primary hover:bg-primary/10"><Shield className="h-3.5 w-3.5" /> Admin</Button>
                </Link>
              )}
              <Link to="/dashboard" className="rounded-full glass p-2" aria-label="Profile">
                <UserIcon className="h-4 w-4" />
              </Link>
              <Button size="sm" variant="ghost" onClick={handleLogout} aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login"><Button size="sm" variant="ghost" className="gap-1"><LogIn className="h-4 w-4" /> Login</Button></Link>
              <Link to="/register"><Button size="sm" className="bg-gold-gradient text-accent-foreground hover:opacity-90 font-bold">Register</Button></Link>
            </>
          )}
        </div>
      </div>

      {open && (
        <nav className="border-t border-white/5 glass-strong px-4 py-2 lg:hidden">
          <div className="flex flex-col gap-1">
            <NavLink to="/" onClick={() => setOpen(false)}>Sports</NavLink>
            <NavLink to="/live" onClick={() => setOpen(false)}>Live</NavLink>
            <NavLink to="/dashboard" onClick={() => setOpen(false)}>My Bets</NavLink>
            <NavLink to="/tokens" onClick={() => setOpen(false)}>Tokens</NavLink>
            <NavLink to="/chat" onClick={() => setOpen(false)}>Chat</NavLink>
            <NavLink to="/support" onClick={() => setOpen(false)}><LifeBuoy className="mr-1 inline h-3.5 w-3.5" /> Support</NavLink>
            <NavLink to="/terms" onClick={() => setOpen(false)}>Terms</NavLink>
            {isAdmin && <NavLink to="/admin" onClick={() => setOpen(false)}>Admin</NavLink>}
          </div>
        </nav>
      )}
    </header>
  );
}

function NavLink({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      activeProps={{ className: "bg-white/5 text-foreground" }}
      activeOptions={{ exact: to === "/" }}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
    >
      {children}
    </Link>
  );
}
