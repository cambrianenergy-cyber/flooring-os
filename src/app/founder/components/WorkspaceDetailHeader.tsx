// Placeholder for header components
// import WorkspaceTitle from "./WorkspaceTitle";
// import HealthBadge from "./HealthBadge";
// import PlanChip from "./PlanChip";
// import BillingStatusBadge from "./BillingStatusBadge";
// import PrimaryActions from "./PrimaryActions";
// import OpenWorkspaceButton from "./OpenWorkspaceButton";
// import ViewContractsButton from "./ViewContractsButton";
// import ViewEstimatesButton from "./ViewEstimatesButton";
// import ImpersonateWorkspaceButton from "./ImpersonateWorkspaceButton";

const WorkspaceDetailHeader = ({ workspace }: { workspace: any }) => {
  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        {/* <WorkspaceTitle title={workspace.name} /> */}
        <div className="text-2xl font-bold">
          {workspace?.name || "Workspace"}
        </div>
        {/* <HealthBadge health={workspace.health} /> */}
        <div>HealthBadge</div>
        {/* <PlanChip plan={workspace.plan} /> */}
        <div>PlanChip</div>
        {/* <BillingStatusBadge status={workspace.billingStatus} /> */}
        <div>BillingStatusBadge</div>
      </div>
      <div className="flex gap-2">
        {/* <PrimaryActions workspace={workspace} /> */}
        <button className="btn btn-primary">Open Workspace</button>
        <button className="btn btn-secondary">View Contracts</button>
        <button className="btn btn-secondary">View Estimates</button>
        <button className="btn btn-accent">Impersonate</button>
      </div>
    </header>
  );
};

export default WorkspaceDetailHeader;
