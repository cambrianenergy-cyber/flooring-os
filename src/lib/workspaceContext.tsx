"use client";
// workspaceContext.tsx
// Provides a React context and hook for the current workspace object

import {
  createContext,
  ReactNode,
  useContext,
  useState
} from "react";

export interface WorkspacePlan {
  key: string;
  activeAddOns?: string[];
  tier?: string;
  // Add more fields as needed for your plan structure
}

export interface Workspace {
  id: string;
  name: string;
  plan: WorkspacePlan;
}

interface WorkspaceContextType {
  workspace: Workspace | null;
  setWorkspace: (ws: Workspace | null) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined,
);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(() => {
    if (typeof window !== "undefined") {
      // Client: load from localStorage
      const wsRaw = localStorage.getItem("workspace");
      if (wsRaw) {
        try {
          return JSON.parse(wsRaw);
        } catch {
          return null;
        }
      }
    } else {
      // Server: try to load from env or session (basic fallback)
      const wsId = process.env.WORKSPACE_ID || process.env.SEED_WORKSPACE_ID;
      if (wsId) {
        return {
          id: wsId,
          name: "Server Workspace",
          plan: { key: "essentials" },
        };
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading workspace context...</p>
        </div>
      </div>
    );
  }

  return (
    <WorkspaceContext.Provider value={{ workspace, setWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx)
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return ctx;
}
