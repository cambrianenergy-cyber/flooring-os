export default function ProgressBar({ step }: { step: number }) {
  const total = 11;
  const percent = Math.round((step / total) * 100);
  return (
    <div className="w-full mb-6">
      <div className="h-2 bg-muted rounded-full">
        <div
          className="h-2 bg-accent rounded-full transition-all progress-bar-inner"
          data-width={`${percent}%`}
        />
      </div>
      <div className="text-xs text-muted mt-1 text-right">Step {step} of {total}</div>
    </div>
  );
}
