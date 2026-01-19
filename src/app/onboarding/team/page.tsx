"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "../OnboardingShell";
import { useOnboardingState, FormCard } from "../../../components/onboarding/FormCard";
import { useWorkspace } from "../../../lib/workspaceContext";
import { authHeaders } from "@/lib/client/authHeader";

type Role = "viewer" | "member" | "admin" | "owner";
type Invite = { email: string; role: Role };

const TEMPLATES = [
  {
    key: "standard",
    name: "Standard Contractor Team",
    desc: "Owner + Estimator + Office/Admin + Installer leads.",
    defaults: [
      { email: "estimator@company.com", role: "member" as Role },
      { email: "office@company.com", role: "admin" as Role },
    ],
  },
  {
    key: "lean",
    name: "Lean Team",
    desc: "Small shop: keep roles tight and simple.",
    defaults: [{ email: "office@company.com", role: "member" as Role }],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    desc: "Multiple admins, structured access.",
    defaults: [
      { email: "ops@company.com", role: "admin" as Role },
      { email: "finance@company.com", role: "admin" as Role },
    ],
  },
] as const;

export default function TeamPage() {
  const router = useRouter();
  const { workspace } = useWorkspace();
  const workspaceId = workspace?.id || "";
  const { data } = useOnboardingState(workspaceId);

  const [templateKey, setTemplateKey] = useState<string>("standard");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("member");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    const t: { templateKey?: string; invites?: Invite[] } = data.team || {};
    setTemplateKey(t.templateKey ?? "standard");
    setInvites(Array.isArray(t.invites) ? t.invites : []);
  }, [data]);

  const template = useMemo(() => TEMPLATES.find((t) => t.key === templateKey) || TEMPLATES[0], [templateKey]);

  function addInvite() {
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) return;
    setInvites((prev) => [...prev, { email, role: newRole }]);
    setNewEmail("");
    setNewRole("member");
  }

  function removeInvite(email: string) {
    setInvites((prev) => prev.filter((i) => i.email !== email));
  }

  function applyTemplate() {
    setInvites((prev) => {
      const existingEmails = new Set(prev.map((x) => x.email));
      const merged = [...prev];
      for (const d of template.defaults) {
        if (!existingEmails.has(d.email)) merged.push(d);
      }
      return merged;
    });
  }

  async function save(next: string) {
    if (!workspaceId) return;
    setBusy(true);
    const headers = await authHeaders();
    await fetch("/api/onboarding/save", {
      method: "POST",
      headers,
      body: JSON.stringify({
        workspaceId,
        patch: {
          step: "team",
          team: {
            templateKey,
            invites,
          },
        },
      }),
    });
    setBusy(false);
    router.push(next);
  }

  return (
    <OnboardingShell step={2}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormCard title="Team & Roles" subtitle="Invite people now or later. Roles control access and security.">
          <div className="rounded-xl border p-4">
            <div className="text-xs text-slate-500">Default permissions template</div>
            <select
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
              value={templateKey}
              onChange={(e) => setTemplateKey(e.target.value)}
            >
              {TEMPLATES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
            </select>
            <div className="mt-2 text-xs text-slate-600">{template.desc}</div>

            <button
              type="button"
              onClick={applyTemplate}
              className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm text-white"
            >
              Apply template suggestions
            </button>
          </div>

          <div className="mt-4 rounded-xl border p-4">
            <div className="text-xs text-slate-500">Add team member</div>
            <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
              <input
                className="rounded-xl border px-3 py-2 text-sm md:col-span-2"
                placeholder="email@company.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <select
                className="rounded-xl border px-3 py-2 text-sm"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as Role)}
              >
                <option value="viewer">viewer</option>
                <option value="member">member</option>
                <option value="admin">admin</option>
                <option value="owner">owner</option>
              </select>
            </div>

            <button type="button" onClick={addInvite} className="mt-3 rounded-xl border px-4 py-2 text-sm">
              Add
            </button>

            <div className="mt-3 text-xs text-slate-500">
              Tip: Owner should be limited. Most staff should be member/admin.
            </div>
          </div>
        </FormCard>

        <FormCard title="Invites Preview" subtitle="These will be created when you launch or when you hit Invite in Team Settings.">
          <div className="space-y-2">
            {invites.length === 0 && (
              <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
                No invites yet. You can invite later.
              </div>
            )}
            {invites.map((i) => (
              <div key={i.email} className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <div className="font-medium">{i.email}</div>
                  <div className="text-xs text-slate-500">Role: {i.role}</div>
                </div>
                <button
                  type="button"
                  onClick={() => removeInvite(i.email)}
                  className="rounded-xl border px-3 py-1.5 text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            Optional later: import contacts or bulk invite via CSV.
          </div>
        </FormCard>
      </div>

      <div className="flex items-center justify-between">
        <button className="rounded-xl border px-4 py-2 text-sm" onClick={() => router.push("/onboarding/company")}>Back</button>
        <div className="flex gap-2">
          <button
            className="rounded-xl border px-4 py-2 text-sm"
            disabled={busy}
            onClick={() => save("/onboarding/stripe")}
            title="You can invite later"
          >
            Invite later
          </button>
          <button
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm text-white disabled:opacity-50"
            disabled={busy}
            onClick={() => save("/onboarding/stripe")}
          >
            {busy ? "Saving…" : "Continue"}
          </button>
        </div>
      </div>
    </OnboardingShell>
  );
}
