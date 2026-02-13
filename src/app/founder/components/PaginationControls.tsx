import React from "react";

interface PaginationControlsProps {
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  page,
  setPage,
  totalPages,
}) => {
  return (
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
  );
};

export default PaginationControls;
