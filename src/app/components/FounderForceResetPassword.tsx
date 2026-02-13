"use client";
import { PermissionDenied } from "@/app/components/PermissionDenied";
import { useToast } from "@/app/components/ToastProvider";
import { isFounder } from "@/lib/auth-utils";
import { auth } from "@/lib/firebase";
import { useState } from "react";

export function FounderForceResetPassword() {
  const user = auth.currentUser;
  const email = user?.email || null;
  const isFounderUser = isFounder(email);
  const [targetEmail, setTargetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  if (!isFounderUser)
    return (
      <PermissionDenied message="Only founders can force-reset user passwords." />
    );

  async function handleReset() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/force-reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-email": email || "" },
        body: JSON.stringify({ email: targetEmail, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.show("Password reset successfully!", "success");
        setTargetEmail("");
        setNewPassword("");
      } else {
        toast.show(data.error || "Failed to reset password", "error");
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as { message?: string }).message
          : undefined;
      toast.show(message || "Failed to reset password", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-red-50 border border-red-300 rounded p-4 my-6">
      <div className="font-bold text-red-800 mb-2">
        Founder: Force-Reset User Password
      </div>
      <div className="flex flex-col gap-2">
        <input
          type="email"
          value={targetEmail}
          onChange={(e) => setTargetEmail(e.target.value)}
          className="border rounded px-2 py-1"
          placeholder="Target user email"
        />
        <input
          type="text"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="border rounded px-2 py-1"
          placeholder="New password"
        />
        <button
          className="bg-red-600 text-background px-3 py-1 rounded mt-2"
          onClick={handleReset}
          disabled={loading || !targetEmail || !newPassword}
        >
          {loading ? "Resetting..." : "Force Reset Password"}
        </button>
      </div>
    </div>
  );
}
