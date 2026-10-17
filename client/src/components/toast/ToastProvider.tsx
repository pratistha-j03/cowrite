import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { ToastContext, type ToastKind } from "./toast-context";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

const icons = {
  success: <CheckCircle2 className="size-5 text-[#6f7f3d]" />,
  error: <XCircle className="size-5 text-[#9b2c2c]" />,
  info: <Info className="size-5 text-accent" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const show = useCallback((kind: ToastKind, message: string) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 border border-ink bg-surface p-3 text-sm shadow-[4px_4px_0_var(--sage)]"
          >
            {icons[t.kind]}
            <p className="flex-1">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}