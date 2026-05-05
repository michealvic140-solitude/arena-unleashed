import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { AppHeader } from "@/components/AppHeader";
import { Toaster } from "@/components/ui/sonner";
import { BetSlipProvider } from "@/lib/betslip";
import { BetSlipFab } from "@/components/BetSlip";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ConfirmDialogHost, PromptDialogHost } from "@/components/ConfirmDialog";
import { MaintenanceGate } from "@/components/MaintenanceGate";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-black brand">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center rounded-lg bg-gold-gradient px-4 py-2 text-sm font-bold text-accent-foreground hover:opacity-90">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "LOMITA SHOOTERS LEAGUE — Luxury Sports Betting with Virtual Tokens" },
      { name: "description", content: "LOMITA SHOOTERS LEAGUE — the luxury virtual-token gang & faction sports betting arena. Place bets, cashout, and chase glory." },
      { property: "og:title", content: "LOMITA SHOOTERS LEAGUE" },
      { name: "twitter:title", content: "LOMITA SHOOTERS LEAGUE" },
      { property: "og:description", content: "Luxury virtual-token sports betting. No mercy, only glory." },
      { name: "twitter:description", content: "Luxury virtual-token sports betting. No mercy, only glory." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/95c9daad-a9fe-4c72-b5b7-9dee8d1f06f1" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/95c9daad-a9fe-4c72-b5b7-9dee8d1f06f1" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <BetSlipProvider>
        <AnimatedBackground />
        <div className="relative z-10 flex min-h-screen flex-col">
          <AppHeader />
          <MaintenanceGate><main className="flex-1"><Outlet /></main></MaintenanceGate>
        </div>
        <BetSlipFab />
        <ConfirmDialogHost />
        <PromptDialogHost />
        <Toaster theme="dark" position="top-right" />
      </BetSlipProvider>
    </AuthProvider>
  );
}
