export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-background text-slate-900 p-5 shadow-sm">
      <div className="text-xs uppercase tracking-wider text-neutral-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-neutral-900">
        {value}
      </div>
      {hint ? (
        <div className="mt-1 text-sm text-neutral-500">{hint}</div>
      ) : null}
    </div>
  );
}
