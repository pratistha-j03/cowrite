export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden fill="none">
      {/* back page (the collaborator) */}
      <rect x="2" y="2" width="24" height="24" fill="var(--sage)" stroke="var(--ink)" strokeWidth="2" />
      {/* front page (you) */}
      <rect x="14" y="14" width="24" height="24" fill="var(--sky)" stroke="var(--ink)" strokeWidth="2" />
      {/* lines of text */}
      <rect x="19" y="21" width="14" height="2.5" fill="var(--ink)" opacity="0.55" />
      <rect x="19" y="27" width="8" height="2.5" fill="var(--ink)" opacity="0.55" />
      {/* the caret */}
      <rect x="29" y="25.5" width="2.5" height="7" fill="var(--ink)" className="logo-caret" />
    </svg>
  );
}

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <span className="inline-flex items-center gap-3">
      <LogoMark className={size === "lg" ? "size-12" : "size-9"} />
      <span className="font-serif text-3xl leading-none tracking-tight">
        <span className="bg-[linear-gradient(var(--sage),var(--sage))] bg-[length:100%_0.32em] bg-bottom bg-no-repeat">
          co
        </span>
        write
      </span>
    </span>
  );
}