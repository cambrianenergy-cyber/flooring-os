
const IssueDetailDrawer = ({
  issue,
  onClose,
}: {
  issue: any;
  onClose: () => void;
}) => {
  if (!issue) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black bg-opacity-30">
      <div className="w-full max-w-md bg-white shadow-xl h-full p-6 overflow-y-auto relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
          onClick={onClose}
        >
          <span className="text-xl">&times;</span>
        </button>
        <h2 className="text-xl font-bold mb-2">System Issue Details</h2>
        <div className="mb-2 text-xs text-gray-500">
          ID: <span className="font-mono">{issue.id}</span>
        </div>
        <div className="mb-2">
          Type: <span className="font-semibold">{issue.type}</span>
        </div>
        <div className="mb-2">
          Severity: <span className="capitalize">{issue.severity}</span>
        </div>
        <div className="mb-2">
          Workspace: {issue.workspaceName || issue.workspaceId}
        </div>
        <div className="mb-2">
          Status: <span className="capitalize">{issue.status}</span>
        </div>
        <div className="mb-2">Occurrences: {issue.occurrences}</div>
        <div className="mb-2">Message:</div>
        <div className="bg-gray-50 rounded p-2 text-xs mb-2">
          {issue.message}
        </div>
        {issue.context && (
          <div className="mb-2">
            <div className="font-semibold text-gray-700">Context</div>
            <pre className="bg-gray-100 text-xs p-2 rounded overflow-x-auto">
              {JSON.stringify(issue.context, null, 2)}
            </pre>
          </div>
        )}
        <div className="mb-2">Timeline:</div>
        <ul className="list-disc ml-6 text-xs mb-2">
          <li>
            First seen:{" "}
            {issue.firstSeenAt
              ? new Date(issue.firstSeenAt.seconds * 1000).toLocaleString()
              : "-"}
          </li>
          <li>
            Last seen:{" "}
            {issue.lastSeenAt
              ? new Date(issue.lastSeenAt.seconds * 1000).toLocaleString()
              : "-"}
          </li>
        </ul>
        <div className="mt-4 flex gap-2">
          <button className="btn btn-xs btn-primary">Acknowledge</button>
          <button className="btn btn-xs btn-secondary">Resolve</button>
        </div>
      </div>
    </div>
  );
};

export default IssueDetailDrawer;
