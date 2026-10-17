import { useId, type InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Field({ label, error, id, className = "", ...input }: Props) {
  const auto = useId();
  const inputId = id ?? auto;
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="eyebrow block text-muted">
        {label}
      </label>
      <input
        {...input}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`block w-full border border-ink/30 bg-surface px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-ink focus:shadow-[3px_3px_0_var(--sky)] aria-invalid:border-[#9b2c2c] ${className}`}
      />
      {error && (
        <p id={errorId} className="text-sm text-[#9b2c2c] dark:text-[#f3b1b1]">
          {error}
        </p>
      )}
    </div>
  );
}