import React, { useState } from "react";
import { useFounderWorkspaceSnapshots } from "../../../hooks/founderDataHooks";

interface Workspace {
  id: string;
  name?: string;
  [key: string]: unknown;
}

interface Props {
  founderId: string;
  onSelect: (workspace: Workspace) => void;
}

const WorkspaceSearchPicker: React.FC<Props> = ({ founderId, onSelect }) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const workspaces = useFounderWorkspaceSnapshots(founderId) as Workspace[];

  const filtered = search
    ? workspaces.filter((w) =>
        (w.name || w.id).toLowerCase().includes(search.toLowerCase()),
      )
    : workspaces;

  return (
    <div>
      <label className="block text-xs font-semibold mb-1">
        Search Workspace
      </label>
      <input
        className="border rounded px-2 py-1 w-full mb-2"
        placeholder="Type workspace name or ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="max-h-40 overflow-y-auto border rounded">
        {filtered.length === 0 ? (
          <div className="text-xs text-gray-400 p-2">No workspaces found</div>
        ) : (
          <ul>
            {filtered.map((w) => (
              <li
                key={w.id}
                className={`px-2 py-1 cursor-pointer hover:bg-blue-50 ${selected === w.id ? "bg-blue-100" : ""}`}
                onClick={() => {
                  setSelected(w.id);
                  onSelect(w);
                }}
              >
                <span className="font-mono text-xs">{w.id}</span>
                {w.name && <span className="ml-2">{w.name}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default WorkspaceSearchPicker;
