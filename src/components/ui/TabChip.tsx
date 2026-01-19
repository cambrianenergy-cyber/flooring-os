export function TabChip({
  label,
  active,
  onSelect,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors duration-150 border ${
        active
          ? "border-[rgba(89,242,194,0.6)] bg-[rgba(89,242,194,0.12)] text-[var(--accent)]"
          : "border-[var(--border)] text-[var(--ink-soft)] hover:text-[var(--ink-strong)] hover:border-[rgba(255,255,255,0.12)]"
      }`}
    >
      <span className="inline-block h-2 w-2 rounded-full bg-[rgba(89,242,194,0.7)]" />
      {label}
    </button>
  );
}
