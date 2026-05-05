import { useRef } from "react";
import { Crosshair, Calendar, Clock, Skull, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Selection { market: string; selection: string; odds_value: number; match_label?: string }
export interface TicketData {
  ticket_code: string;
  booking_code: string | null;
  user_name: string;
  created_at: string;
  stake: number;
  total_odds: number;
  potential_payout: number;
  selections: Selection[];
}

export function TicketSlip({ data, onClose }: { data: TicketData; onClose?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const d = new Date(data.created_at);
  const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "LSL Bet Ticket", text: `Ticket ${data.ticket_code} — Code: ${data.booking_code}` }); } catch {}
    } else {
      navigator.clipboard.writeText(`Ticket ${data.ticket_code} — Booking code: ${data.booking_code}`);
    }
  };

  return (
    <div className="space-y-4">
      <div ref={ref} className="mx-auto max-w-sm overflow-hidden rounded-2xl bg-white text-black shadow-2xl">
        {/* Header */}
        <div className="relative bg-black px-5 py-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight">LSL</span>
                <span className="text-3xl font-black italic text-primary">{data.ticket_code.replace("LSL", "")}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px] tracking-[0.3em] text-primary">
                <span className="h-px w-6 bg-primary" /> BETTING TICKET <span className="h-px w-6 bg-primary" />
              </div>
            </div>
            <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 border-primary bg-black">
              <span className="text-[10px] font-black text-white">LSL</span>
              <span className="text-xs font-black text-primary">{data.ticket_code.slice(-4)}</span>
            </div>
          </div>
        </div>
        {/* Body */}
        <div className="space-y-3 p-5">
          <div className="flex justify-between border-b border-dashed border-gray-300 pb-3">
            <div className="flex items-start gap-2">
              <Crosshair className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="text-[10px] font-bold tracking-wider text-primary">NAME</p>
                <p className="text-sm font-bold">{data.user_name}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wider text-primary">TICKET ID</p>
              <p className="text-sm font-bold">{data.ticket_code}</p>
            </div>
          </div>
          <div className="flex justify-between border-b border-dashed border-gray-300 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <div>
                <p className="text-[10px] font-bold tracking-wider text-primary">DATE</p>
                <p className="text-sm font-bold">{dateStr}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <p className="text-[10px] font-bold tracking-wider text-primary">TIME</p>
                <p className="text-sm font-bold">{timeStr}</p>
              </div>
            </div>
          </div>
          <div className="rounded bg-black px-3 py-2 text-white">
            <p className="text-[11px] font-bold tracking-wider">📋 YOUR BETS</p>
          </div>
          {data.selections.map((s, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-gray-200 pb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-primary">
                {i % 2 === 0 ? <Skull className="h-4 w-4" /> : <Crown className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">{i + 1}. {s.match_label ?? s.selection}</p>
                <p className="text-[11px] text-gray-500">{s.market}</p>
              </div>
              <p className="text-base font-black">{s.odds_value.toFixed(2)}</p>
            </div>
          ))}
          <div className="space-y-1 border-b border-dashed border-gray-300 py-2 text-sm">
            <div className="flex justify-between"><span className="font-bold text-primary">BET TYPE</span><span className="font-bold">{data.selections.length}-Fold</span></div>
            <div className="flex justify-between"><span className="font-bold text-primary">AMOUNT STAKING</span><span className="font-bold">{Number(data.stake).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="font-bold text-primary">TOTAL ODDS</span><span className="font-bold">{Number(data.total_odds).toFixed(2)}</span></div>
          </div>
          <div className="rounded bg-black px-3 py-2 text-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary">💰 POSSIBLE PAY OUT</span>
              <span className="text-lg font-black text-primary">{Number(data.potential_payout).toLocaleString()}</span>
            </div>
          </div>
          <div className="pt-2 text-center">
            <p className="font-mono text-2xl tracking-[0.4em]">||| |||| || ||| |</p>
            <p className="mt-1 text-xs font-bold">{data.ticket_code}</p>
          </div>
        </div>
        <div className="border-t border-primary bg-black py-2 text-center">
          <p className="text-[10px] font-bold tracking-wider text-primary">★ PLAY SMART. PLAY LSL ★</p>
        </div>
      </div>
      <div className="flex justify-center gap-2">
        <Button onClick={share} size="sm" variant="outline">Share</Button>
        {onClose && <Button onClick={onClose} size="sm">Close</Button>}
      </div>
    </div>
  );
}
