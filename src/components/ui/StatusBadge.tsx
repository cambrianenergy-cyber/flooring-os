type StatusTone = "accent" | "muted" | "warning";

export function StatusBadge({ label, tone }: { label: string; tone: StatusTone }) {
  const toneClasses = {
    accent: "bg-[rgba(89,242,194,0.12)] text-[var(--accent)] border-[rgba(89,242,194,0.35)]",
    muted: "bg-[rgba(255,255,255,0.06)] text-[var(--ink-soft)] border-[rgba(255,255,255,0.08)]",
    warning: "bg-[rgba(246,181,86,0.14)] text-[var(--warning)] border-[rgba(246,181,86,0.35)]",
  }[tone];

  return (
    <span className={`pill px-3 py-1 text-xs font-semibold tracking-wide uppercase ${toneClasses}`}>
      {label}
    </span>
  );
}
