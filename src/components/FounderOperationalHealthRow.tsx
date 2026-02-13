import { DocusignHealthPanel } from "./DocusignHealthPanel";
import { SystemHealthPanel } from "./SystemHealthPanel";

export default function FounderOperationalHealthRow({
  founderId,
}: {
  founderId: string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Billing Health Panel */}
      {/* <BillingHealthPanel founderId={founderId} /> */}
      {/* DocuSign Health Panel */}
      <DocusignHealthPanel founderId={founderId} />
      {/* System Health Panel */}
      <SystemHealthPanel founderId={founderId} />
    </div>
  );
}
