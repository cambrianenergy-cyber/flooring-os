import React, { useEffect, useState } from "react";

const PRESET_PROFILES = [
  { label: "Small Shop", values: { laborRate: 35, overhead: 10, targetMargin: 0.25, materialMarkup: 0.15, depositPercent: 10, minDeposit: 200, rounding: "nearest10" } },
  { label: "Premium", values: { laborRate: 50, overhead: 20, targetMargin: 0.35, materialMarkup: 0.25, depositPercent: 50, minDeposit: 500, rounding: "nearest100" } },
  { label: "Commercial", values: { laborRate: 40, overhead: 15, targetMargin: 0.18, materialMarkup: 0.10, depositPercent: 20, minDeposit: 1000, rounding: "none" } },
];

const ROUNDING_OPTIONS = [
  { value: "none", label: "No rounding" },
  { value: "nearest10", label: "Round to nearest $10" },
  { value: "nearest100", label: "Round to nearest $100" },
];

export default function PricingSettingsPanel({ workspaceId }: { workspaceId: string }) {
  const [settings, setSettings] = useState({
    laborRate: 35,
    overhead: 10,
    targetMargin: 0.25,
    materialMarkup: 0.15,
    depositPercent: 10,
    minDeposit: 200,
    rounding: "none",
  });
  const [profile, setProfile] = useState("");
  // Removed unused loading state
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState<number | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    fetch(`/api/workspaces/${workspaceId}/pricing-settings`)
      .then(res => res.json())
      .then(data => {
        if (data.pricing) setSettings(data.pricing);
      });
  }, [workspaceId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value
    }));
  };

  const handleProfile = (profileLabel: string) => {
    setProfile(profileLabel);
    const found = PRESET_PROFILES.find(p => p.label === profileLabel);
    if (found) setSettings(found.values);
  };

  const handleSave = async () => {
    setStatus("Saving...");
    await fetch(`/api/workspaces/${workspaceId}/pricing-settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setStatus("Saved!");
    setTimeout(() => setStatus(""), 1200);
  };

  // Live preview: example estimate
  useEffect(() => {
    // Example: 1000 material, 20 labor hours
    // Use a microtask to avoid direct setState in effect
    Promise.resolve().then(() => {
      const material = 1000 * (1 + (settings.materialMarkup || 0));
      const labor = (settings.laborRate || 0) * 20;
      const overhead = (settings.overhead || 0);
      let subtotal = material + labor + overhead;
      subtotal = subtotal / (1 - (settings.targetMargin || 0));
      let total = subtotal;
      // Rounding
      if (settings.rounding === "nearest10") total = Math.round(total / 10) * 10;
      if (settings.rounding === "nearest100") total = Math.round(total / 100) * 100;
      setPreview(total);
    });
  }, [settings]);

  return (
    <div className="bg-green-50 border border-green-200 rounded p-4 mb-6">
      <div className="font-bold text-green-800 mb-2">Pricing Settings (Margin Engine)</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold mb-1">Labor Rate ($/hr)</label>
          <input type="number" name="laborRate" value={settings.laborRate} onChange={handleChange} className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Overhead ($)</label>
          <input type="number" name="overhead" value={settings.overhead} onChange={handleChange} className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Target Margin (%)</label>
          <input type="number" name="targetMargin" value={settings.targetMargin} min={0} max={1} step={0.01} onChange={handleChange} className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Material Markup (%)</label>
          <input type="number" name="materialMarkup" value={settings.materialMarkup} min={0} max={1} step={0.01} onChange={handleChange} className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Deposit %</label>
          <input type="number" name="depositPercent" value={settings.depositPercent} min={0} max={100} onChange={handleChange} className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Min Deposit ($)</label>
          <input type="number" name="minDeposit" value={settings.minDeposit} onChange={handleChange} className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Rounding</label>
          <select name="rounding" value={settings.rounding} onChange={handleChange} className="input">
            {ROUNDING_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Preset Profiles</label>
          <select value={profile} onChange={e => handleProfile(e.target.value)} className="input">
            <option value="">Select...</option>
            {PRESET_PROFILES.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
          </select>
        </div>
      </div>
      <button className="bg-green-700 text-white px-4 py-2 rounded font-semibold hover:bg-green-800 transition mb-2" onClick={handleSave}>Save Settings</button>
      {status && <span className="ml-2 text-green-700 text-xs">{status}</span>}
      <div className="mt-4 p-3 bg-green-100 rounded">
        <div className="font-semibold text-green-900 mb-1">Live Preview</div>
        <div className="text-green-800 text-sm">Example estimate (20 labor hours, $1000 material): <span className="font-bold">${preview?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
      </div>
    </div>
  );
}
