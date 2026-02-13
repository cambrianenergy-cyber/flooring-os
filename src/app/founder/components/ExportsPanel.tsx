import React, { useState } from "react";

const ExportsPanel: React.FC = () => {
  const [exporting, setExporting] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleExport = async (type: "workspaces" | "billing") => {
    setExporting(type);
    setResult(null);
    try {
      const url =
        type === "workspaces"
          ? "/api/founder/exports/workspaces-csv"
          : "/api/founder/exports/billing-issues-csv";
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download =
          type === "workspaces" ? "workspaces.csv" : "billing-issues.csv";
        link.click();
        setResult("Export complete.");
      } else {
        setResult("Export failed.");
      }
    } catch {
      setResult("Export error.");
    }
    setExporting(null);
  };

  return (
    <section className="bg-white rounded shadow p-4 mb-4">
      <h2 className="text-lg font-bold mb-2">Exports</h2>
      <div className="flex gap-2 mb-2">
        <button
          className="btn btn-xs btn-secondary"
          onClick={() => handleExport("workspaces")}
          disabled={exporting === "workspaces"}
        >
          {exporting === "workspaces"
            ? "Exporting..."
            : "Export workspaces CSV"}
        </button>
        <button
          className="btn btn-xs btn-secondary"
          onClick={() => handleExport("billing")}
          disabled={exporting === "billing"}
        >
          {exporting === "billing" ? "Exporting..." : "Export billing issues"}
        </button>
      </div>
      {result && <div className="text-xs mt-1">{result}</div>}
    </section>
  );
};

export default ExportsPanel;
