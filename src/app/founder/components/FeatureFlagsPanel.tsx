import React, { useEffect, useState } from "react";

interface FeatureFlag {
  id: string;
  value: boolean;
}

interface Props {
  founderId: string;
}

const FeatureFlagsPanel: React.FC<Props> = ({ founderId }) => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!founderId) return;
    fetch(`/api/founder/flags?founderId=${founderId}`)
      .then((res) => res.json())
      .then((data) => {
        setFlags(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [founderId]);

  return (
    <section className="bg-white rounded shadow p-4 mb-4">
      <h2 className="text-lg font-bold mb-2">Feature Flags</h2>
      {loading ? (
        <div className="text-xs text-gray-400">Loading...</div>
      ) : flags.length === 0 ? (
        <div className="text-xs text-gray-400">No feature flags found.</div>
      ) : (
        <ul className="text-xs">
          {flags.map((flag) => (
            <li key={flag.id} className="py-1 flex items-center gap-2">
              <span className="font-mono">{flag.id}</span>
              <span className={flag.value ? "text-green-600" : "text-red-600"}>
                {flag.value ? "ENABLED" : "DISABLED"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default FeatureFlagsPanel;
