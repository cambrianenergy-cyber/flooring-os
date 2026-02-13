import React from "react";
import HealthBadge from "../components/HealthBadge";
import PlanChip from "../components/PlanChip";
// import BillingStatusBadge from "./BillingStatusBadge";

interface WorkspaceDetailHeaderProps {
  workspace: {
    workspaceName?: string;
    health?: string;
    plan?: string;
    status?: string;
    [key: string]: any;
  };
}

const WorkspaceDetailHeader: React.FC<WorkspaceDetailHeaderProps> = ({
  workspace,
}) => {
  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="text-2xl font-bold">
          {workspace.workspaceName || workspace.id || "Workspace"}
        </div>
        {workspace.health && <HealthBadge health={workspace.health} />}
        {workspace.plan && <PlanChip plan={workspace.plan} />}
        {/* {workspace.status && <BillingStatusBadge status={workspace.status} />} */}
      </div>
      <div className="flex gap-2">
        <button className="btn btn-primary">Open Workspace</button>
        <button className="btn btn-secondary">View Contracts</button>
        <button className="btn btn-secondary">View Estimates</button>
        <button className="btn btn-accent">Impersonate</button>
      </div>
    </header>
  );
};

export default WorkspaceDetailHeader;
