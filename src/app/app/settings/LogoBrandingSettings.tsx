// DEV MODE: single-tenant until SaaS/multi-tenant is implemented
"use client";
import { useEffect, useMemo, useState } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

type LogoPlacement =
  | "sidebar"
  | "topbar"
  | "login"
  | "quotes"
  | "invoices"
  | "reports";

type BrandingSettings = {
  logoUrl?: string;
  placements?: LogoPlacement[];
  updatedAt?: import("firebase/firestore").Timestamp | null;
  updatedBy?: string | null;
  updatedByEmail?: string | null;
};

const PLACEMENT_OPTIONS: { key: LogoPlacement; label: string; desc: string }[] = [
  { key: "sidebar", label: "Sidebar", desc: "Logo at top of left navigation" },
  { key: "topbar", label: "Top Bar", desc: "Logo in header/top navigation" },
  { key: "login", label: "Login Screen", desc: "Logo above login form" },
  { key: "quotes", label: "Quotes", desc: "Include logo on quote view/export later" },
  { key: "invoices", label: "Invoices", desc: "Include logo on invoices later" },
  { key: "reports", label: "Reports", desc: "Include logo on KPI/report exports later" },
];

// Returns tenantId from subdomain or fallback
function getTenantId() {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // e.g. tenant1.squareos.com → tenant1
    const parts = host.split(".");
    if (parts.length > 2) {
      return parts[0];
    }
  }
  return "square-flooring"; // fallback for dev/local
}


type LogoBrandingSettingsProps = {
  tenantId?: string;
};

export default function LogoBrandingSettings({ tenantId: propTenantId }: LogoBrandingSettingsProps) {
  const tenantId = useMemo(() => propTenantId || getTenantId(), [propTenantId]);
  const brandingRef = useMemo(
    () => doc(db, "tenants", tenantId, "settings", "branding"),
    [tenantId]
  );

  const [existing, setExisting] = useState<BrandingSettings | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [placements, setPlacements] = useState<LogoPlacement[]>(["sidebar"]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    (async () => {
      const snap = await getDoc(brandingRef);
      if (snap.exists()) {
        const data = snap.data() as BrandingSettings;
        setExisting(data);
        if (data.placements?.length) setPlacements(data.placements);
      } else {
        setExisting({});
      }
    })();
  }, [brandingRef]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function togglePlacement(p: LogoPlacement) {
    setPlacements((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function saveLogo() {
    setStatus("");
    if (!file) {
      setStatus("❌ Choose a logo image first.");
      return;
    }

    // Basic file guardrails
    const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      setStatus("❌ Please upload PNG, JPG, WEBP, or SVG.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setStatus("❌ Max file size is 2MB for now.");
      return;
    }
    if (placements.length === 0) {
      setStatus("❌ Select at least one placement.");
      return;
    }

    setSaving(true);
    try {
      const stamp = Date.now();
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `tenants/${tenantId}/branding/logo/${stamp}_${safeName}`;

      // Upload to Firebase Storage
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file, {
        contentType: file.type,
        cacheControl: "public,max-age=31536000",
      });

      const logoUrl = await getDownloadURL(storageRef);

      // Save URL + placements to Firestore
      await setDoc(
        brandingRef,
        {
          logoUrl,
          placements,
          updatedAt: serverTimestamp(),
          updatedBy: auth.currentUser?.uid ?? null,
          updatedByEmail: auth.currentUser?.email ?? null,
        },
        { merge: true }
      );

      setExisting((prev) => ({ ...(prev ?? {}), logoUrl, placements }));
      setFile(null);
      setStatus("✅ Logo uploaded and settings saved.");
    } catch (e: unknown) {
      const errMsg = (e && typeof e === "object" && "message" in e) ? (e as { message?: string }).message : undefined;
      setStatus(`❌ Upload failed: ${errMsg ?? "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl text-[#e8edf7]">
      <h1 className="text-2xl font-semibold text-[#e8edf7]">Settings</h1>
      <p className="text-sm text-[#9fb2c9] mt-2">
        Upload your Square Flooring Pro Suite logo and choose where it appears in the app.
      </p>

      <div className="mt-6 grid gap-4">
        <div className="border rounded-xl bg-[#1b2435] border-[#252f42] p-4">
          <h2 className="font-medium text-[#e8edf7]">Branding</h2>
          <p className="text-sm text-[#9fb2c9] mt-1">
            Recommended: PNG with transparent background, 512×512.
          </p>

          {/* Current logo */}
          <div className="mt-4 flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg border bg-[#0f1624] border-[#252f42] flex items-center justify-center overflow-hidden">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
              ) : existing?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={existing.logoUrl} alt="Current Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-xs text-gray-500">No logo</span>
              )}
            </div>

            <div className="flex-1">
              <div className="text-sm font-medium">Logo</div>
              <div className="text-xs text-gray-500">
                Stored at: <span className="font-mono">tenants/{tenantId}/branding/logo/...</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <label className="inline-flex items-center gap-2 border rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  Choose Logo
                </label>

                <button
                  onClick={saveLogo}
                  disabled={saving || !file}
                  className="px-4 py-2 rounded-md bg-black text-white text-sm disabled:opacity-50"
                >
                  {saving ? "Uploading..." : "Upload & Save"}
                </button>
              </div>
            </div>
          </div>

          {/* Placement options */}
          <div className="mt-6">
            <div className="text-sm font-medium">Logo Placement</div>
            <p className="text-xs text-gray-500 mt-1">
              Choose where the logo shows in the UI. (We’ll wire these placements into the layout next.)
            </p>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PLACEMENT_OPTIONS.map((opt) => {
                const active = placements.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => togglePlacement(opt.key)}
                    className={`text-left border rounded-lg p-3 hover:bg-gray-50 ${
                      active ? "border-gray-900 bg-gray-50" : "border-gray-200"
                    }`}
                  >
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-xs text-gray-500">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {status && (
            <div
              className={`mt-4 text-sm font-medium ${status.startsWith("✅") ? "status-success" : "status-error"}`}
            >
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}