import React from "react";

interface Estimate {
  id?: string | number;
  name?: string;
  createdAt?: string | Date;
  [key: string]: unknown;
}

interface Contract {
  id?: string | number;
  name?: string;
  createdAt?: string | Date;
  [key: string]: unknown;
}

interface WorkspacePipelinePanelProps {
  estimates: Estimate[];
  contracts: Contract[];
}

const WorkspacePipelinePanel: React.FC<WorkspacePipelinePanelProps> = ({
  estimates,
  contracts,
}) => {
  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RecentEstimatesList estimates={estimates} />
        <RecentContractsList contracts={contracts} />
      </div>
      <div className="mt-4">
        <PipelineConversionWidget estimates={estimates} contracts={contracts} />
      </div>
    </div>
  );
};

// Placeholder for RecentEstimatesList
const RecentEstimatesList: React.FC<{
  estimates: Estimate[];
}> = ({ estimates }) => (
  <div className="bg-white rounded shadow p-4">
    <div className="font-semibold mb-2">Recent Estimates</div>
    <ul className="text-sm max-h-48 overflow-y-auto">
      {estimates.length === 0 && (
        <li className="text-gray-400">No estimates</li>
      )}
      {estimates.map((est, i) => (
        <li key={est.id || i} className="border-b last:border-b-0 py-1">
          {est.name || est.id || "Estimate"} -{" "}
          {est.createdAt ? new Date(est.createdAt).toLocaleDateString() : "-"}
        </li>
      ))}
    </ul>
  </div>
);

// Placeholder for RecentContractsList
const RecentContractsList: React.FC<{
  contracts: Contract[];
}> = ({ contracts }) => (
  <div className="bg-white rounded shadow p-4">
    <div className="font-semibold mb-2">Recent Contracts</div>
    <ul className="text-sm max-h-48 overflow-y-auto">
      {contracts.length === 0 && (
        <li className="text-gray-400">No contracts</li>
      )}
      {contracts.map((con, i) => (
        <li key={con.id || i} className="border-b last:border-b-0 py-1">
          {con.name || con.id || "Contract"} -{" "}
          {con.createdAt ? new Date(con.createdAt).toLocaleDateString() : "-"}
        </li>
      ))}
    </ul>
  </div>
);

// Placeholder for PipelineConversionWidget
const PipelineConversionWidget: React.FC<{
  estimates: Estimate[];
  contracts: Contract[];
}> = ({ estimates, contracts }) => {
  const conversion =
    estimates.length > 0
      ? ((contracts.length / estimates.length) * 100).toFixed(1)
      : "-";
  return (
    <div className="bg-blue-50 rounded shadow p-4 text-center">
      <div className="text-xs text-blue-700 mb-1">
        Estimate → Contract Conversion
      </div>
      <div className="text-2xl font-bold text-blue-900">{conversion}%</div>
      <div className="text-xs text-blue-500">
        ({contracts.length} contracts / {estimates.length} estimates)
      </div>
    </div>
  );
};

export default WorkspacePipelinePanel;
