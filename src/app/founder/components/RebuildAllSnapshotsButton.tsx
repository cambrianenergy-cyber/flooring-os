import React, { useState } from "react";

const RebuildAllSnapshotsButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleRebuild = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/founder/snapshot/rebuild", {
        method: "POST",
      });
      if (res.ok) {
        setResult("All workspace snapshots rebuild triggered.");
      } else {
        setResult("Failed to trigger rebuild.");
      }
    } catch (e) {
      setResult("Error triggering rebuild.");
    }
    setLoading(false);
  };

  return (
    <div>
      <button
        className="btn btn-xs btn-secondary"
        onClick={handleRebuild}
        disabled={loading}
      >
        {loading ? "Rebuilding..." : "Rebuild All Snapshots"}
      </button>
      {result && <div className="text-xs mt-1">{result}</div>}
    </div>
  );
};

export default RebuildAllSnapshotsButton;
