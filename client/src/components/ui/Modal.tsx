import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose} // fires on Escape and on programmatic close
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // backdrop click
      }}
      className="m-auto w-[min(28rem,92vw)] border border-ink bg-surface p-0 text-ink shadow-[10px_10px_0_var(--sky)] backdrop:bg-black/50"
    >
      <div className="p-6">
        <h2 className="mb-4 text-2xl font-serif tracking-tight">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}