export type ActionItem = {
  title: string;
  subtitle: string;
  cta: string;
};

export function ActionList({
  title,
  items,
}: {
  title: string;
  items: ActionItem[];
}) {
  return (
    <div className="rounded-2xl bg-background text-slate-900 p-5 shadow-sm">
      <div className="text-lg font-semibold text-neutral-900">{title}</div>
      <div className="mt-4 flex flex-col gap-3">
        {items.map((x, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-4 rounded-2xl bg-neutral-50 px-4 py-3"
          >
            <div>
              <div className="font-medium text-neutral-900">{x.title}</div>
              <div className="text-sm text-neutral-600">{x.subtitle}</div>
            </div>
            <button className="rounded-2xl bg-neutral-900 px-4 py-2 text-sm text-white shadow-sm hover:opacity-90">
              {x.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
