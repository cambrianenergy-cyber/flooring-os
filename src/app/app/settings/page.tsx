"use client";

import React, { useEffect, useState } from "react";

import LogoBrandingSettings from "./LogoBrandingSettings";
import CompanyProfilePage from "./CompanyProfilePage";
import PricingSettingsPanel from "./PricingSettingsPanel";
// Helper to get tenantId from subdomain or fallback
function getTenantId() {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const parts = host.split(".");
    if (parts.length > 2) {
      return parts[0];
    }
  }
  return "square-flooring";
}
import RoleGuard from "@/components/RoleGuard";
import ApiKeyForm from "../../../components/ApiKeyForm";


import { useUserRole } from "@/lib/useUserRole";
import { auth } from "@/lib/firebase";
import { isFounder } from "@/lib/auth-utils";


export default function SettingsPage() {
  const { role, loading } = useUserRole();
  const user = auth.currentUser;
  const email = user?.email || null;
  if (loading && !user) return null;
  if (!(role === "owner" || role === "admin" || isFounder(email))) {
    return <div className="text-red-600 p-8">You do not have permission to view settings.</div>;
  }
  const handleSaveApiKey = (key: string) => {
    // TODO: Implement save logic (e.g., call API, update state)
    alert(`API Key saved: ${key}`);
  };
  // Get workspaceId from Firebase user
  const [workspaceId, setWorkspaceId] = useState<string>("");
  useEffect(() => {
    (async () => {
      const { getAuth } = await import("firebase/auth");
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) setWorkspaceId(user.uid);
    })();
  }, []);
  return (
    <div>
      <button onClick={() => window.history.back()} className="mb-4 text-blue-600 underline">Back</button>
      <CompanyProfilePage />
      <LogoBrandingSettings tenantId={getTenantId()} />
      {workspaceId && <PricingSettingsPanel workspaceId={workspaceId} />}
      <ApiKeyForm apiKey={""} onSave={handleSaveApiKey} />
    </div>
  );
}
