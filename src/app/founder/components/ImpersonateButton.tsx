import { useRouter } from "next/navigation";
import React from "react";

interface Props {
  workspaceId: string;
}

const ImpersonateButton: React.FC<Props> = ({ workspaceId }) => {
  const router = useRouter();

  const handleImpersonate = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("activeWorkspaceId", workspaceId);
      router.push("/app");
    }
  };

  return (
    <button
      className="btn btn-primary btn-xs"
      onClick={handleImpersonate}
      disabled={!workspaceId}
    >
      Impersonate Workspace
    </button>
  );
};

export default ImpersonateButton;
