// src/app/app/admin/roles/page.tsx
"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { ROLE_LABELS, UserRole } from "@/lib/roles";

export default function RolesAdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    })();
  }, []);

  async function updateRole(uid: string, role: UserRole) {
    setSaving(uid);
    await updateDoc(doc(db, "users", uid), { role });
    setUsers((prev) => prev.map((u) => (u.id === uid ? { ...u, role } : u)));
    setSaving(null);
  }

  if (loading) return <div>Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">User Roles</h1>
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">User ID</th>
            <th className="p-2 text-left">Role</th>
            <th className="p-2">Change</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="p-2 font-mono">{u.id}</td>
              <td className="p-2">{u.role ? ROLE_LABELS[u.role as UserRole] : <span className="text-gray-400">None</span>}</td>
              <td className="p-2">
                <select
                  value={u.role || ""}
                  onChange={(e) => updateRole(u.id, e.target.value as UserRole)}
                  disabled={saving === u.id}
                  className="border rounded px-2 py-1"
                >
                  <option value="">Select…</option>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
