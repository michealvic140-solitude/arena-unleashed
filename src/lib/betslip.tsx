import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface SlipPick {
  match_id: string;
  match_label: string;   // "Arsenal vs Chelsea"
  market: string;        // "1X2"
  selection: string;     // "1" / "X" / "2" / "Over 2.5"
  odds_value: number;
}

interface SlipCtx {
  picks: SlipPick[];
  open: boolean;
  setOpen: (b: boolean) => void;
  add: (p: SlipPick) => void;
  remove: (match_id: string, market: string) => void;
  clear: () => void;
  has: (match_id: string, market: string, selection: string) => boolean;
  totalOdds: number;
}

const Ctx = createContext<SlipCtx | undefined>(undefined);

export function BetSlipProvider({ children }: { children: ReactNode }) {
  const [picks, setPicks] = useState<SlipPick[]>([]);
  const [open, setOpen] = useState(false);

  const add = useCallback((p: SlipPick) => {
    setPicks((prev) => {
      // one selection per match+market
      const filtered = prev.filter((x) => !(x.match_id === p.match_id && x.market === p.market));
      return [...filtered, p];
    });
    setOpen(true);
  }, []);

  const remove = useCallback((match_id: string, market: string) => {
    setPicks((prev) => prev.filter((x) => !(x.match_id === match_id && x.market === market)));
  }, []);

  const clear = useCallback(() => setPicks([]), []);

  const has = useCallback(
    (match_id: string, market: string, selection: string) =>
      picks.some((p) => p.match_id === match_id && p.market === market && p.selection === selection),
    [picks],
  );

  const totalOdds = useMemo(
    () => picks.reduce((acc, p) => acc * p.odds_value, 1),
    [picks],
  );

  return (
    <Ctx.Provider value={{ picks, open, setOpen, add, remove, clear, has, totalOdds }}>
      {children}
    </Ctx.Provider>
  );
}

export function useBetSlip() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useBetSlip must be inside BetSlipProvider");
  return c;
}
