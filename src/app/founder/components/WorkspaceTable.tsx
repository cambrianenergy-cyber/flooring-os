import React from "react";
import WorkspaceRow from "./WorkspaceRow";
import WorkspaceTableHeader from "./WorkspaceTableHeader";

interface Workspace {
  id?: string | number;
  workspaceId?: string | number;
  name: string;
  industry: string;
  health: string;
  plan: string;
  billingStatus: string;
  // Add other properties as needed
}

interface WorkspaceTableProps {
  workspaces: Workspace[];
  page: number;
  setPage: (page: number) => void;
  rowsPerPage?: number;
}

const WorkspaceTable: React.FC<WorkspaceTableProps> = ({
  workspaces,
  page,
  setPage,
  rowsPerPage = 10,
}) => {
  // Calculate pagination (simple, can be replaced with real logic)
  const totalPages = Math.ceil(workspaces.length / rowsPerPage);
  const pagedWorkspaces = workspaces.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border rounded">
        <WorkspaceTableHeader />
        <tbody>
          {pagedWorkspaces.map((ws) => (
            <WorkspaceRow key={ws.id || ws.workspaceId} workspace={ws} />
          ))}
        </tbody>
      </table>
      {/* Pagination controls placeholder */}
      <div className="flex justify-end items-center gap-2 mt-2">
        <button
          className="btn btn-sm"
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          className="btn btn-sm"
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default WorkspaceTable;
