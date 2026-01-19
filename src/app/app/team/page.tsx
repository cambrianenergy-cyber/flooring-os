"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, setDoc, doc, serverTimestamp, query, where } from "firebase/firestore";
import { useCallback } from "react";
import { useRef } from "react";
import { ROLE_LABELS, UserRole } from "@/lib/roles";
import { useRouter } from "next/navigation";
import { useUserRole } from "@/lib/useUserRole";
import { auth } from "@/lib/firebase";
import { isFounder } from "@/lib/auth-utils";

// User type
type User = {
  id: string;
  name?: string;
  email?: string;
  role?: UserRole | null;
  workspaceId?: string;
  removedAt?: Date | null | undefined;
  status?: string;
};

const ROLES: UserRole[] = ["owner", "admin", "manager", "sales", "installer", "warehouse", "accounting"];
const DEFAULT_ROLE: UserRole = "warehouse";

export default function TeamPage() {
  const router = useRouter();
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { role, loading: roleLoading } = useUserRole();
  const user = auth.currentUser;
  const email = user?.email || null;

  // Add employee form state
  const [form, setForm] = useState({ name: "", email: "", role: DEFAULT_ROLE, permissionsTemplate: "default", inviteLater: false });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Workspace scoping: prefer localStorage workspaceId pattern used elsewhere
  useEffect(() => {
    const ws = typeof window === "undefined" ? "" : localStorage.getItem("workspaceId") || "";
    setWorkspaceId(ws);
  }, []);

  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }
    (async () => {
      const q = query(collection(db, "users"), where("workspaceId", "==", workspaceId));
      const snap = await getDocs(q);
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as User)));
      setLoading(false);
    })();
  }, [adding, workspaceId]);

  const isPrivileged = role === "owner" || role === "admin" || isFounder(email);
  if (roleLoading && !user) return null;
  if (!isPrivileged) {
    return <div className="text-[#ff9b76] p-8">You do not have permission to view the employee directory.</div>;
  }
  if (!workspaceId) {
    return <div className="text-[#ff9b76] p-8">No workspace selected. Set localStorage.workspaceId to load team members.</div>;
  }

  // Add employee logic
  async function handleAddEmployee(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setSuccessMsg(null);
    setInfoMsg(null);
    if (!form.email.trim() || !form.role) {
      setAddError("Email and role are required.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setAddError("Invalid email address.");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          role: form.role,
          permissionsTemplate: form.permissionsTemplate,
          inviteLater: form.inviteLater,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setForm({ name: "", email: "", role: DEFAULT_ROLE, permissionsTemplate: "default", inviteLater: false });
      setSuccessMsg(form.inviteLater ? "Member added (invite later)." : "Invite sent!");
      if (formRef.current) formRef.current.reset();
    } catch (err: any) {
      setAddError(err.message || "Failed to add/invite member.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <button onClick={() => router.back()} className="mb-4 text-accent underline">Back</button>
      <h1 className="text-2xl font-semibold text-foreground">Employee Directory</h1>

      {/* Add Employee Form */}
      {/* Status banners */}
      {addError && <div className="mb-2 p-2 bg-red-100 text-red-700 rounded">{addError}</div>}
      {successMsg && <div className="mb-2 p-2 bg-green-100 text-green-700 rounded">{successMsg}</div>}
      {infoMsg && <div className="mb-2 p-2 bg-blue-100 text-blue-700 rounded">{infoMsg}</div>}

      <form ref={formRef} onSubmit={handleAddEmployee} className="mb-6 flex flex-col md:flex-row gap-2 items-start md:items-end">
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold mb-1 text-foreground">Email</label>
          <input
            type="email"
            className="border rounded px-2 py-1 w-52 bg-dark-surface text-foreground border-dark-muted"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            disabled={adding}
            required
          />
        </div>
        {/* Role */}
        <div>
          <label className="block text-xs font-semibold mb-1 text-foreground">Role</label>
          <select
            className="border rounded px-2 py-1 bg-dark-surface text-foreground border-dark-muted"
            value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
            disabled={adding}
            required
          >
            {ROLES.map(r => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>
        {/* Permissions Template */}
        <div>
          <label className="block text-xs font-semibold mb-1 text-foreground">Permissions Template</label>
          <select
            className="border rounded px-2 py-1 bg-dark-surface text-foreground border-dark-muted"
            value={form.permissionsTemplate}
            onChange={e => setForm(f => ({ ...f, permissionsTemplate: e.target.value }))}
            disabled={adding}
          >
            <option value="default">Default</option>
            <option value="limited">Limited</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        {/* Invite Later */}
        <div className="flex items-center mt-2">
          <input
            type="checkbox"
            id="inviteLater"
            checked={form.inviteLater}
            onChange={e => setForm(f => ({ ...f, inviteLater: e.target.checked }))}
            disabled={adding}
          />
          <label htmlFor="inviteLater" className="ml-1 text-xs text-foreground">Invite Later</label>
        </div>
        <button
          type="submit"
          className="bg-accent text-background px-4 py-2 rounded disabled:opacity-50 font-medium"
          disabled={adding}
        >
          {adding ? "Adding..." : (form.inviteLater ? "Add (Invite Later)" : "Invite Member")}
        </button>
        {addError && <span className="text-danger ml-2">{addError}</span>}
      </form>

      {loading ? (
        <div className="text-muted">Loading…</div>
      ) : users.length === 0 ? (
        <div className="text-muted">No employees found.</div>
      ) : (
        <table className="w-full border text-sm mt-4">
          <thead>
            <tr className="bg-dark-muted text-foreground">
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-2">{u.name || <span className="text-muted">(No name)</span>}</td>
                <td className="p-2">{u.email || <span className="text-muted">(No email)</span>}</td>
                <td className="p-2">{u.role ? ROLE_LABELS[u.role] : <span className="text-muted">(No role)</span>}</td>
                <td className="p-2">
                  {/* Status indicator: show invited, pending, active, removed, etc. */}
                  {u.status === "invited" && <span className="text-blue-600">Invited</span>}
                  {u.status === "pending" && <span className="text-yellow-600">Pending</span>}
                  {u.status === "active" && <span className="text-green-600">Active</span>}
                  {u.status === "removed" && <span className="text-gray-400">Removed</span>}
                  {!u.status && <span className="text-gray-400">Unknown</span>}
                </td>
                <td className="p-2">
                  {isPrivileged && u.email !== email && u.role !== "owner" && u.status !== "removed" && (
                    <button
                      className="text-danger underline ml-2"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!window.confirm(`Remove ${u.name || u.email}? This will revoke their access but keep their audit history.`)) return;
                        // Remove member logic: call backend API
                        try {
                          const res = await fetch(`/api/workspaces/${workspaceId}/team`, {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email: u.email }),
                          });
                          if (!res.ok) throw new Error(await res.text());
                          setInfoMsg("Member removed.");
                        } catch (err: any) {
                          setAddError(err.message || "Failed to remove member.");
                        }
                      }}
                    >
                      Remove Member
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
