import { useEffect, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Opts {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

let resolver: ((v: boolean) => void) | null = null;
let setOpenExt: ((v: boolean) => void) | null = null;
let setOptsExt: ((o: Opts) => void) | null = null;

export function confirmDialog(opts: Opts): Promise<boolean> {
  return new Promise((resolve) => {
    resolver = resolve;
    setOptsExt?.(opts);
    setOpenExt?.(true);
  });
}

export function ConfirmDialogHost() {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<Opts>({ title: "" });
  useEffect(() => { setOpenExt = setOpen; setOptsExt = setOpts; }, []);
  const close = (val: boolean) => {
    setOpen(false);
    resolver?.(val);
    resolver = null;
  };
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) close(false); }}>
      <DialogContent className="glass-strong border-primary/20 backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${opts.destructive ? "bg-destructive/20" : "bg-primary/20"}`}>
              <AlertTriangle className={`h-5 w-5 ${opts.destructive ? "text-destructive" : "text-primary"}`} />
            </div>
            {opts.title}
          </DialogTitle>
          {opts.description && <DialogDescription className="pt-2 text-base">{opts.description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => close(false)}>{opts.cancelText ?? "Cancel"}</Button>
          <Button variant={opts.destructive ? "destructive" : "default"} onClick={() => close(true)}>
            {opts.confirmText ?? "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface PromptOpts extends Opts {
  placeholder?: string;
  defaultValue?: string;
  multiline?: boolean;
}
let promptResolver: ((v: string | null) => void) | null = null;
let setPromptOpenExt: ((v: boolean) => void) | null = null;
let setPromptOptsExt: ((o: PromptOpts) => void) | null = null;

export function promptDialog(opts: PromptOpts): Promise<string | null> {
  return new Promise((resolve) => {
    promptResolver = resolve;
    setPromptOptsExt?.(opts);
    setPromptOpenExt?.(true);
  });
}

export function PromptDialogHost() {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<PromptOpts>({ title: "" });
  const [val, setVal] = useState("");
  useEffect(() => { setPromptOpenExt = setOpen; setPromptOptsExt = (o) => { setOpts(o); setVal(o.defaultValue ?? ""); }; }, []);
  const close = (v: string | null) => { setOpen(false); promptResolver?.(v); promptResolver = null; };
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) close(null); }}>
      <DialogContent className="glass-strong border-primary/20">
        <DialogHeader>
          <DialogTitle>{opts.title}</DialogTitle>
          {opts.description && <DialogDescription>{opts.description}</DialogDescription>}
        </DialogHeader>
        {opts.multiline ? (
          <textarea className="w-full rounded-lg bg-background/50 p-3 text-sm" rows={4}
            placeholder={opts.placeholder} value={val} onChange={(e) => setVal(e.target.value)} />
        ) : (
          <input className="w-full rounded-lg bg-background/50 p-3 text-sm"
            placeholder={opts.placeholder} value={val} onChange={(e) => setVal(e.target.value)} />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => close(null)}>{opts.cancelText ?? "Cancel"}</Button>
          <Button onClick={() => close(val)}>{opts.confirmText ?? "OK"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
