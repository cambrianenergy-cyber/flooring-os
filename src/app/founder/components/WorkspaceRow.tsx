import React from "react";
import BillingStatusBadge from "./BillingStatusBadge";
import HealthBadge from "./HealthBadge";
import PlanChip from "./PlanChip";
import RowActions from "./RowActions";

interface Workspace {
  name: string;
  industry: string;
  health: string;
  plan: string;
  billingStatus: string;
  mrr?: number;
  wins30d?: number;
  updatedAt?: string | Date | null;
}

interface WorkspaceRowProps {
  workspace: Workspace;
}

const WorkspaceRow: React.FC<WorkspaceRowProps> = ({ workspace }) => {
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-2 font-medium">{workspace.name}</td>
      <td className="px-4 py-2">{workspace.industry}</td>
      <td className="px-4 py-2">
        <HealthBadge health={workspace.health} />
      </td>
      <td className="px-4 py-2">
        <PlanChip plan={workspace.plan} />
      </td>
      <td className="px-4 py-2">
        <BillingStatusBadge value={workspace.billingStatus} />
      </td>
      <td className="px-4 py-2">{workspace.mrr ? `$${workspace.mrr}` : "-"}</td>
      <td className="px-4 py-2">{workspace.wins30d ?? "-"}</td>
      <td className="px-4 py-2">
        {workspace.updatedAt
          ? new Date(workspace.updatedAt).toLocaleDateString()
          : "-"}
      </td>
      <td className="px-4 py-2">
        <RowActions workspace={workspace} />
      </td>
    </tr>
  );
};

export default WorkspaceRow;
