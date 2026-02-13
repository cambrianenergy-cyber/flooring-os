export function FounderBadge({ isFounder }: { isFounder: boolean }) {
  if (!isFounder) return null;
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-1 text-sm text-amber-900 shadow-sm">
      <span className="h-2 w-2 rounded-full bg-amber-500" />
      Founder Mode
    </div>
  );
}
