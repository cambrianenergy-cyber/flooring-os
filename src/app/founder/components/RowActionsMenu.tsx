import React, { useState } from "react";

interface RowActionsMenuProps {
  actions: { label: string; onClick: () => void; icon?: React.ReactNode }[];
}

const RowActionsMenu: React.FC<RowActionsMenuProps> = ({ actions }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        className="btn btn-xs btn-ghost"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        ⋮
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-36 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {actions.map((action, i) => (
              <button
                key={i}
                className="w-full text-left px-4 py-2 text-xs hover:bg-gray-100 flex items-center gap-2"
                onClick={() => {
                  setOpen(false);
                  action.onClick();
                }}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RowActionsMenu;
