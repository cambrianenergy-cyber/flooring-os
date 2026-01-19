"use client";

export function LockedBanner({ locked }: { locked: boolean }) {
  if (!locked) return null;
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
      <div className="font-semibold text-rose-800">Workspace Locked</div>
      <div className="text-sm text-rose-700">
        Lock Mode is enabled. Setup edits may be restricted by your security policy.
      </div>
    </div>
  );
}
