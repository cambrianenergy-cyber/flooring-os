
const ContractDetailDrawer = ({
  contract,
  onClose,
}: {
  contract: any;
  onClose: () => void;
}) => {
  if (!contract) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black bg-opacity-30">
      <div className="w-full max-w-md bg-white shadow-xl h-full p-6 overflow-y-auto relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
          onClick={onClose}
        >
          <span className="text-xl">&times;</span>
        </button>
        <h2 className="text-xl font-bold mb-2">Contract Details</h2>
        <div className="mb-2 text-xs text-gray-500">
          Envelope ID:{" "}
          <span className="font-mono">
            {contract.envelopeId || contract.id}
          </span>
        </div>
        <div className="mb-2">
          Status: <span className="font-semibold">{contract.status}</span>
        </div>
        <div className="mb-2">
          Workspace: {contract.workspaceName || contract.workspaceId}
        </div>
        <div className="mb-2">Customer: {contract.customerName || "-"}</div>
        <div className="mb-2">Sales Rep: {contract.salesRep || "-"}</div>
        <div className="mb-2">
          Sent At:{" "}
          {contract.sentAt
            ? new Date(contract.sentAt.seconds * 1000).toLocaleString()
            : "-"}
        </div>
        <div className="mb-2">Stuck Days: {contract.stuckDays}</div>
        <div className="mb-2">Status Transitions:</div>
        <ul className="list-disc ml-6 text-xs mb-2">
          {(contract.statusTransitions || []).map((t: any, i: number) => (
            <li key={i}>
              {t.status} at{" "}
              {t.at ? new Date(t.at.seconds * 1000).toLocaleString() : "-"}
            </li>
          ))}
        </ul>
        {contract.error && (
          <div className="mb-2">
            <div className="font-semibold text-red-600">Error</div>
            <pre className="bg-red-50 text-xs p-2 rounded overflow-x-auto">
              {JSON.stringify(contract.error, null, 2)}
            </pre>
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <a
            href={`/founder/workspaces/${contract.workspaceId}`}
            className="btn btn-xs btn-primary"
          >
            Jump to workspace
          </a>
          <a
            href={contract.contractUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-xs btn-secondary"
          >
            Open contract
          </a>
        </div>
      </div>
    </div>
  );
};

export default ContractDetailDrawer;
