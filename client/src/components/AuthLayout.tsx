import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "./Logo";

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: Props) {
  return (
    <div className="relative flex min-h-svh items-center justify-center px-4 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <main className="w-full max-w-md">
        <div className="mb-8">
          <Logo size="lg" />
        </div>
        <div className="border border-line bg-surface p-8 shadow-[10px_10px_0_var(--sky)]">
          <h1 className="font-serif text-4xl leading-tight tracking-tight">{title}</h1>
          <p className="mb-6 mt-2 text-muted">{subtitle}</p>
          {children}
        </div>
        <p className="mt-8 text-center text-sm text-muted">{footer}</p>
      </main>
    </div>
  );
}