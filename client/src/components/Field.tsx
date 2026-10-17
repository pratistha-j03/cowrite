import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Field({ label, error, ...input }: Props) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...input} aria-invalid={error ? true : undefined} />
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}