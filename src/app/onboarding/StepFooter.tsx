import React from "react";

interface StepFooterProps {
  onBack?: () => void;
  onSave?: () => void;
  onContinue?: () => void;
  loading?: boolean;
  disableContinue?: boolean;
}

export default function StepFooter({ onBack, onSave, onContinue, loading, disableContinue }: StepFooterProps) {
  return (
    <div className="flex gap-4 mt-6">
      {onBack && (
        <button type="button" className="bg-muted px-4 py-2 rounded" onClick={onBack}>
          Back
        </button>
      )}
      {onSave && (
        <button type="button" className="bg-muted px-4 py-2 rounded" onClick={onSave}>
          Save
        </button>
      )}
      {onContinue && (
        <button
          type="button"
          className="bg-accent text-background px-4 py-2 rounded"
          onClick={onContinue}
          disabled={loading || disableContinue}
        >
          {loading ? "Saving…" : "Continue"}
        </button>
      )}
    </div>
  );
}
