"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6 space-y-3">
      <h1 className="text-2xl font-semibold text-[#ff9b76]">Workflow Runs crashed</h1>

      <div className="rounded border p-3 bg-[#1b2435] border-[#252f42]">
        <div className="text-sm text-[#9fb2c9] mb-1">Error message</div>
        <pre className="text-xs whitespace-pre-wrap text-[#e8edf7]">{error?.message}</pre>
      </div>

      {error?.digest && (
        <div className="rounded border p-3 bg-[#1b2435] border-[#252f42]">
          <div className="text-sm text-[#9fb2c9] mb-1">Digest</div>
          <pre className="text-xs whitespace-pre-wrap text-[#e8edf7]">{error.digest}</pre>
        </div>
      )}

      <button
        onClick={() => reset()}
        className="px-3 py-2 rounded bg-[#59f2c2] text-[#0c111a] font-medium"
      >
        Retry
      </button>
    </div>
  );
}
