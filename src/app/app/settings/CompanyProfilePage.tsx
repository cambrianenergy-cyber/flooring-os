import React, { useState } from "react";

interface CompanyProfileData {
  legalName: string;
  dba: string;
  ein?: string;
  serviceArea: string;
  address: string;
  phone: string;
  licensed: boolean;
  insured: boolean;
  logoUrl?: string;
  brandColor?: string;
  installTypes: string[];
  preferredSupplier: string;
}

const INSTALL_OPTIONS = [
  "LVP",
  "Hardwood",
  "Tile",
  "Carpet",
  "Laminate",
  "Stone",
  "Vinyl",
  "Other",
];
const SUPPLIER_OPTIONS = [
  "Shaw",
  "Mohawk",
  "ProSource",
  "Floor & Decor",
  "Other",
];

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState<CompanyProfileData>({
    legalName: "",
    dba: "",
    ein: "",
    serviceArea: "",
    address: "",
    phone: "",
    licensed: false,
    insured: false,
    logoUrl: "",
    brandColor: "",
    installTypes: [],
    preferredSupplier: "",
  });
  const [status, setStatus] = useState<string>("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value, type } = target;
    setProfile((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (target as HTMLInputElement).checked : value,
    }));
  };

  const handleInstallType = (type: string) => {
    setProfile((prev) =>
      prev.installTypes.includes(type)
        ? { ...prev, installTypes: prev.installTypes.filter((t) => t !== type) }
        : { ...prev, installTypes: [...prev.installTypes, type] },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Saving...");
    // TODO: Wire to backend API
    setTimeout(() => setStatus("Saved!"), 1000);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-background text-slate-900 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Company Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Legal Business Name</label>
          <input
            name="legalName"
            value={profile.legalName}
            onChange={handleChange}
            className="input"
            required
          />
        </div>
        <div>
          <label className="block font-medium">DBA</label>
          <input
            name="dba"
            value={profile.dba}
            onChange={handleChange}
            className="input"
          />
        </div>
        <div>
          <label className="block font-medium">
            EIN <span className="text-muted">(optional)</span>
          </label>
          <input
            name="ein"
            value={profile.ein}
            onChange={handleChange}
            className="input"
          />
        </div>
        <div>
          <label className="block font-medium">
            Service Area (city/zip or radius)
          </label>
          <input
            name="serviceArea"
            value={profile.serviceArea}
            onChange={handleChange}
            className="input"
            required
          />
        </div>
        <div>
          <label className="block font-medium">Business Address</label>
          <input
            name="address"
            value={profile.address}
            onChange={handleChange}
            className="input"
            required
          />
        </div>
        <div>
          <label className="block font-medium">Business Phone</label>
          <input
            name="phone"
            value={profile.phone}
            onChange={handleChange}
            className="input"
            required
          />
        </div>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="licensed"
              checked={profile.licensed}
              onChange={handleChange}
            />{" "}
            Licensed
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="insured"
              checked={profile.insured}
              onChange={handleChange}
            />{" "}
            Insured
          </label>
        </div>
        <div>
          <label className="block font-medium">Brand Logo</label>
          <input type="file" name="logo" className="input" disabled />
          <span className="text-muted text-xs">(Logo upload coming soon)</span>
        </div>
        <div>
          <label className="block font-medium">Brand Color</label>
          <input
            type="color"
            name="brandColor"
            value={profile.brandColor}
            onChange={handleChange}
            className="w-12 h-8 p-0 border-none"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">What do you install?</label>
          <div className="flex flex-wrap gap-2">
            {INSTALL_OPTIONS.map((type) => (
              <label key={type} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={profile.installTypes.includes(type)}
                  onChange={() => handleInstallType(type)}
                />
                {type}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block font-medium">Preferred Supplier</label>
          <select
            name="preferredSupplier"
            value={profile.preferredSupplier}
            onChange={handleChange}
            className="input"
          >
            <option value="">Select supplier</option>
            {SUPPLIER_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary">
          Save Profile
        </button>
        {status && <div className="text-green-600 mt-2">{status}</div>}
      </form>
    </div>
  );
}
