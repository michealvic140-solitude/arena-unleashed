export function formatTokens(n: number | string | null | undefined): string {
  const v = typeof n === "string" ? parseFloat(n) : n ?? 0;
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
}

export function countdownParts(target: Date | string): { d: number; h: number; m: number; s: number; total: number } {
  const t = (typeof target === "string" ? new Date(target) : target).getTime();
  const diff = Math.max(0, t - Date.now());
  const total = Math.floor(diff / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { d, h, m, s, total };
}

export function pad2(n: number) { return n.toString().padStart(2, "0"); }
