"use client";
import { useState } from "react";
import LogoUploadButton from "@/components/LogoUploadButton";
import RoleGuard from "@/components/RoleGuard";
import Image from "next/image";

const PLACEMENT_OPTIONS = [
  { key: "home", label: "Home page header (centered)" },
  { key: "sidebar", label: "Sidebar (if applicable)" },
  { key: "pdf", label: "PDF/Invoice templates (future feature)" },
];

function LogoSettingsSection() {
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string | null>(null);
  const [selectedPlacements, setSelectedPlacements] = useState<string[]>(["home"]);

  function handlePlacementToggle(key: string) {
    setSelectedPlacements((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key]
    );
  }



  return (
    <div className="mb-8 p-4 border rounded bg-[#1b2435] border-[#252f42]">
      <h2 className="text-lg font-semibold mb-2 text-[#e8edf7]">Upload Company Logo</h2>
      <p className="text-sm text-[#9fb2c9] mb-2">
        Your logo will appear in the locations you select below. For best results, use a transparent PNG or SVG, 200x60px or similar.
      </p>
      <div className="mb-2 flex flex-col gap-2">
        {PLACEMENT_OPTIONS.map((opt) => (
          <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedPlacements.includes(opt.key)}
              onChange={() => handlePlacementToggle(opt.key)}
              className="accent-[#59f2c2]"
            />
            <span className="text-xs text-[#e8edf7]">{opt.label}</span>
          </label>
        ))}
      </div>
      <RoleGuard required={["owner", "admin", "settings"]} fallback={
        <div className="mt-2 text-[#ff9b76] text-base font-medium bg-[rgba(255,155,118,0.1)] border border-[#ff9b76] rounded p-4 flex flex-col items-center">
          <span className="mb-2">Custom branding is a premium feature.</span>
          <span className="mb-2">Only <b>Owners</b> or <b>Admins</b> can change the company logo.</span>
          <span className="mb-4 text-sm text-[#ff9b76]">Upgrade your plan to unlock logo upload and other advanced features.</span>
          <button
            className="bg-[#59f2c2] hover:bg-[#4ad9a8] text-[#0c111a] font-semibold px-4 py-2 rounded shadow"
            onClick={() => {
              // TODO: Replace with real upgrade modal or redirect
              alert('Upgrade coming soon! Contact support or visit the billing page.');
            }}
          >
            Upgrade Now
          </button>
        </div>
      }>
        <LogoUploadButton onLogoUploaded={(url) => {
          setUploadSuccess(true);
          setUploadedLogoUrl(url);
        }} />
      </RoleGuard>
      {uploadSuccess && (
        <div className="mt-2 text-[#59f2c2] text-sm font-medium">Logo uploaded successfully!</div>
      )}
      {uploadedLogoUrl && (
        <div className="mt-4 flex flex-col items-center">
          <span className="text-xs text-[#9fb2c9] mb-1">Preview:</span>
          <Image
            src={uploadedLogoUrl}
            alt="Uploaded logo preview"
            width={200}
            height={60}
            className="logo-preview-img"
          />
        </div>
      )}
    </div>
  );
}

export default LogoSettingsSection;
