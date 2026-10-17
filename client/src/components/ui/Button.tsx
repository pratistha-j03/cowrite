import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-paper shadow-[4px_4px_0_var(--sage)] hover:-translate-y-px active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_var(--sage)]",
  secondary:
    "border border-ink bg-surface text-ink hover:bg-sky/40",
  ghost: "text-ink hover:bg-line",
  danger:
    "bg-[#9b2c2c] text-white shadow-[4px_4px_0_var(--sage)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_var(--sage)]",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  loading = false,
  className = "",
  disabled,
  children,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}