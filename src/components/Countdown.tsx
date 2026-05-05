import { useEffect, useState } from "react";
import { countdownParts, pad2 } from "@/lib/format";

interface Props { to: string | Date; compact?: boolean; gold?: boolean; onComplete?: () => void }

export function Countdown({ to, compact, gold, onComplete }: Props) {
  const [parts, setParts] = useState(() => countdownParts(to));
  useEffect(() => {
    const t = setInterval(() => {
      const p = countdownParts(to);
      setParts(p);
      if (p.total === 0) onComplete?.();
    }, 1000);
    return () => clearInterval(t);
  }, [to, onComplete]);

  const cls = gold ? "text-gold" : "";
  if (compact) {
    if (parts.d > 0) return <span className={`font-mono tabular-nums ${cls}`}>{parts.d}d {pad2(parts.h)}h</span>;
    return <span className={`font-mono tabular-nums ${cls}`}>{pad2(parts.h)}:{pad2(parts.m)}:{pad2(parts.s)}</span>;
  }
  return (
    <div className={`flex items-center justify-center gap-1.5 font-mono tabular-nums ${cls}`}>
      <CdBox v={parts.d} l="D" />:<CdBox v={parts.h} l="H" />:<CdBox v={parts.m} l="M" />:<CdBox v={parts.s} l="S" />
    </div>
  );
}

function CdBox({ v, l }: { v: number; l: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-md glass-gold px-2 py-1 text-2xl font-black">{pad2(v)}</div>
      <div className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{l}</div>
    </div>
  );
}
