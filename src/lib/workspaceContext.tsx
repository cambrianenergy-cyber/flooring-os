"use client";
// workspaceContext.tsx
// Provides a React context and hook for the current workspace object

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";


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

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    // Example: Load workspace from localStorage or mock
    const wsRaw = typeof window !== "undefined" ? localStorage.getItem("workspace") : null;
    let ws: Workspace | null = null;
    if (wsRaw) {
      try {
        ws = JSON.parse(wsRaw);
      } catch {
        ws = null;
      }
    }
    if (!ws) {
      // Fallback: mock workspace (customize as needed)
      ws = {
        id: "demo-workspace",
        name: "Demo Workspace",
        plan: {
          key: "foundation",
          activeAddOns: [
            // Example: enable all workflow packs for demo
            "zero-lead-leak-pack",
            "instant-lead-response-pack",
            "follow-up-cadence-pack",
            "dead-lead-recovery-pack"
          ],
          tier: "foundation"
        },
      };
    }
    // Avoid calling setState synchronously in effect
    setTimeout(() => setWorkspace(ws), 0);
  }, []);

  return (
    <WorkspaceContext.Provider value={{ workspace, setWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return ctx;
}
