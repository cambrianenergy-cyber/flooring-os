
export function EmptyState({
  message = "No data available.",
  cta,
  onCta,
  showCta = false,
}: {
  message?: string;
  cta?: string;
  onCta?: () => void;
  showCta?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-2xl text-gray-400 mb-4">{message}</div>
      {showCta && cta && (
        <button
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
          onClick={onCta}
        >
          {cta}
        </button>
      )}
    </div>
  );
}
