import { useEffect } from "react";
import { useWorkspace, Workspace } from "@/lib/workspaceContext";

/**
 * Call this hook after user login and after fetching the user's workspace from Firestore.
 * It will set the workspace context and persist it to localStorage.
 *
 * @param workspaceObj The workspace object fetched from Firestore (must have id, name, plan)
 */
export function useSetWorkspaceAfterLogin(workspaceObj: Workspace) {
  const { setWorkspace } = useWorkspace();
  useEffect(() => {
    if (workspaceObj && workspaceObj.id) {
      setWorkspace(workspaceObj);
      if (typeof window !== "undefined") {
        localStorage.setItem("workspace", JSON.stringify(workspaceObj));
      }
    }
  }, [workspaceObj, setWorkspace]);
}
