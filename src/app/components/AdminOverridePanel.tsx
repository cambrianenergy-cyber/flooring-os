"use client";
import React, { useState } from "react";
import { useToast } from "@/app/components/ToastProvider";
import { PermissionDenied } from "@/app/components/PermissionDenied";
import { useUserRole } from "@/lib/useUserRole";
import { isFounder } from "@/lib/auth-utils";
import { auth } from "@/lib/firebase";


export interface Props {
  onForceInvite?: (email: string) => Promise<void>;
  onResetQuota?: () => Promise<void>;
  onUnlockFeature?: (feature: string) => Promise<void>;
}

export function AdminOverridePanel({ onForceInvite, onResetQuota, onUnlockFeature }: Props) {
  // workspaceId is required for API calls but not directly used in this component
  const { role } = useUserRole();
  const user = auth.currentUser;
  const email = user?.email || null;
  const isPrivileged = role === "owner" || role === "admin" || isFounder(email);
  const [inviteEmail, setInviteEmail] = useState("");
  const [feature, setFeature] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const toast = useToast();
  if (!isPrivileged) return <PermissionDenied message="You must be an owner, admin, or founder to use override tools." />;

  return (
    <div className="bg-yellow-50 border border-yellow-300 rounded p-4 my-6">
      <div className="font-bold text-yellow-800 mb-2">Admin/Founder Overrides</div>
      <div className="flex flex-col gap-4">
        {onForceInvite && (
          <div>
            <label className="block text-sm font-medium mb-1">Force-invite user (email):</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="border rounded px-2 py-1"
                placeholder="user@example.com"
              />
              <button
                className="bg-yellow-600 text-white px-3 py-1 rounded"
                onClick={async () => {
                  setMessage(null);
                  try {
                    await onForceInvite(inviteEmail);
                    setMessage("Invite sent!");
                    toast.show("Invite sent!", "success");
                  } catch (err: unknown) {
                    setMessage("Error sending invite.");
                    const message = err && typeof err === "object" && "message" in err ? (err as { message?: string }).message : undefined;
                    toast.show(message || "Error sending invite.", "error");
                  }
                }}
              >Send</button>
            </div>
          </div>
        )}
        {onResetQuota && (
          <button
            className="bg-yellow-600 text-white px-3 py-1 rounded"
            onClick={async () => {
              setMessage(null);
              try {
                await onResetQuota();
                setMessage("Quota reset!");
                toast.show("Quota reset!", "success");
              } catch (err: unknown) {
                setMessage("Error resetting quota.");
                const message = err && typeof err === "object" && "message" in err ? (err as { message?: string }).message : undefined;
                toast.show(message || "Error resetting quota.", "error");
              }
            }}
          >Reset AI/Workflow Quota</button>
        )}
        {onUnlockFeature && (
          <div>
            <label className="block text-sm font-medium mb-1">Unlock feature:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={feature}
                onChange={e => setFeature(e.target.value)}
                className="border rounded px-2 py-1"
                placeholder="featureKey"
              />
              <button
                className="bg-yellow-600 text-white px-3 py-1 rounded"
                onClick={async () => {
                  setMessage(null);
                  try {
                    await onUnlockFeature(feature);
                    setMessage("Feature unlocked!");
                    toast.show("Feature unlocked!", "success");
                  } catch (err: unknown) {
                    setMessage("Error unlocking feature.");
                    const message = err && typeof err === "object" && "message" in err ? (err as { message?: string }).message : undefined;
                    toast.show(message || "Error unlocking feature.", "error");
                  }
                }}
              >Unlock</button>
            </div>
          </div>
        )}
        {message && <div className="text-yellow-700 mt-2">{message}</div>}
      </div>
    </div>
  );
}
