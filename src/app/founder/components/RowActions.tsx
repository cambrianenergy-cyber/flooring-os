import { useRouter } from "next/navigation";
import React from "react";

interface RowActionsProps {
  workspace: any;
}

const RowActions: React.FC<RowActionsProps> = ({ workspace }) => {
  const router = useRouter();

  const handleOpen = () => {
    router.push(`/founder/workspaces/${workspace.id || workspace.workspaceId}`);
  };

  const handleBilling = () => {
    router.push(
      `/founder/billing?workspaceId=${workspace.id || workspace.workspaceId}`,
    );
  };

  const handleImpersonate = () => {
    // Optionally set activeWorkspaceId in context here
    // Then route to /app
    // Example: setActiveWorkspaceId(workspace.id); router.push('/app');
    router.push("/app");
  };

  return (
    <div className="flex gap-2">
      <button
        className="btn btn-xs btn-primary"
        onClick={handleOpen}
        title="Open Workspace"
      >
        Open
      </button>
      <button
        className="btn btn-xs btn-secondary"
        onClick={handleBilling}
        title="Billing"
      >
        Billing
      </button>
      <button
        className="btn btn-xs btn-accent"
        onClick={handleImpersonate}
        title="Impersonate"
      >
        Impersonate
      </button>
    </div>
  );
};

export default RowActions;
