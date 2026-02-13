import React, { useState } from "react";

interface Props {
  workspaceId: string;
}

const RebuildWorkspaceSnapshotButton: React.FC<Props> = ({ workspaceId }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleRebuild = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(
        `/api/founder/snapshot/rebuild?workspaceId=${workspaceId}`,
        { method: "POST" },
      );
      if (res.ok) {
        setResult("Workspace snapshot rebuild triggered.");
      } else {
        setResult("Failed to trigger rebuild.");
      }
    } catch {
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
        {loading ? "Rebuilding..." : "Rebuild Workspace Snapshot"}
      </button>
      {result && <div className="text-xs mt-1">{result}</div>}
    </div>
  );
};

export default RebuildWorkspaceSnapshotButton;
