"use client";
import { db } from "@/lib/firebase";
import { useFounderAuth } from "@/lib/useFounderAuth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function FounderTeamPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isFounderUser, ready, user } = useFounderAuth();
  const founderUserId = user?.uid;
  if (!founderUserId) return <div>Missing founderUserId in context</div>;

  useEffect(() => {
    if (!ready || !isFounderUser) return;
    async function fetchTeam() {
      setLoading(true);
      // Fetch team members from Firestore
      const q = query(
        collection(db, "members"),
        where("founderUserId", "==", founderUserId),
      );
      const snap = await getDocs(q);
      setTeam(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }
    fetchTeam();
  }, [ready, isFounderUser, founderUserId]);

  if (!ready) return <div>Loading...</div>;
  if (!isFounderUser) return <div>Access denied.</div>;
  if (loading) return <div>Loading team data...</div>;

  return (
    <div className="rounded-3xl bg-background text-slate-900 p-6 shadow-sm">
      <div className="text-2xl font-semibold mb-4">Team & Roles (Founder)</div>
      <table className="min-w-full text-sm border mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Role</th>
            <th className="p-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {team.map((member, i) => (
            <tr key={i} className="border-t">
              <td className="p-2 font-semibold">{member.email}</td>
              <td className="p-2">{member.role}</td>
              <td className="p-2">{member.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-neutral-600">
        Invite users, manage roles, revoke access, and see permission history.
      </p>
    </div>
  );
}
