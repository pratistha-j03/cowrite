import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

interface Props {
  onRename: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export function DocMenu({ onRename, onDelete, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item =
    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-line";

  return (
    <div ref={ref} className="relative z-10">
      <button
        type="button"
        aria-label="Document actions"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="p-1.5 text-muted transition-colors hover:bg-line disabled:opacity-50"
      >
        <MoreHorizontal className="size-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1 w-40 border border-ink bg-surface py-1 shadow-[4px_4px_0_var(--sage)]"
        >
          <button
            role="menuitem"
            type="button"
            className={item}
            onClick={() => {
              setOpen(false);
              onRename();
            }}
          >
            <Pencil className="size-4" /> Rename
          </button>
          <button
            role="menuitem"
            type="button"
            className={`${item} text-[#9b2c2c] dark:text-[#f3b1b1]`}
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            <Trash2 className="size-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}