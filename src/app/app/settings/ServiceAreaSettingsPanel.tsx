"use client";
import React, { useState, useEffect } from "react";

interface TravelZone {
  id: number;
  name: string;
  minMiles: number;
  maxMiles: number;
  fee: string;
}

export default function ServiceAreaSettingsPanel({ workspaceId }: { workspaceId: string }) {
  const [baseAddress, setBaseAddress] = useState("");
  const [serviceRadius, setServiceRadius] = useState("25");
  const [additionalCities, setAdditionalCities] = useState("");
  const [zipCodes, setZipCodes] = useState("");
  const [excludedAreas, setExcludedAreas] = useState("");
  const [excludedZipCodes, setExcludedZipCodes] = useState("");
  const [leadFilteringMode, setLeadFilteringMode] = useState<'reject' | 'fee' | 'manual'>('manual');
  const [enableTravelZones, setEnableTravelZones] = useState(false);
  const [travelZones, setTravelZones] = useState<TravelZone[]>([
    { id: 1, name: "Zone 1", minMiles: 0, maxMiles: 25, fee: "0" },
    { id: 2, name: "Zone 2", minMiles: 25, maxMiles: 50, fee: "150" },
    { id: 3, name: "Zone 3", minMiles: 50, maxMiles: 75, fee: "300" },
  ]);
  const [status, setStatus] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse cities and ZIP codes for preview
  const citiesList = additionalCities.split('\n').map(c => c.trim()).filter(c => c.length > 0);
  const zipCodesList = zipCodes.split(/[\n,\s]+/).map(z => z.trim()).filter(z => /^\d{5}$/.test(z));
  const excludedAreasList = excludedAreas.split('\n').map(a => a.trim()).filter(a => a.length > 0);
  const excludedZipCodesList = excludedZipCodes.split(/[\n,\s]+/).map(z => z.trim()).filter(z => /^\d{5}$/.test(z));

  // Load saved settings
  useEffect(() => {
    if (!workspaceId) return;
    
    // Try loading from API (when implemented)
    fetch(`/api/workspaces/${workspaceId}/service-area`)
      .then(res => res.json())
      .then(data => {
        if (data.serviceArea) {
          setBaseAddress(data.serviceArea.baseAddress || '');
          setServiceRadius(data.serviceArea.serviceRadius || '25');
          setAdditionalCities(data.serviceArea.additionalCities || '');
          setZipCodes(data.serviceArea.zipCodes || '');
          setExcludedAreas(data.serviceArea.excludedAreas || '');
          setExcludedZipCodes(data.serviceArea.excludedZipCodes || '');
          setLeadFilteringMode(data.serviceArea.leadFilteringMode || 'manual');
          setEnableTravelZones(data.serviceArea.enableTravelZones || false);
          if (data.serviceArea.travelZones) setTravelZones(data.serviceArea.travelZones);
        }
      })
      .catch(() => {
        // Fallback to localStorage for now
        const saved = localStorage.getItem('onboarding_step3');
        if (saved) {
          const data = JSON.parse(saved);
          setBaseAddress(data.baseAddress || '');
          setServiceRadius(data.serviceRadius || '25');
          setAdditionalCities(data.additionalCities || '');
          setZipCodes(data.zipCodes || '');
          setExcludedAreas(data.excludedAreas || '');
          setExcludedZipCodes(data.excludedZipCodes || '');
          setLeadFilteringMode(data.leadFilteringMode || 'manual');
          setEnableTravelZones(data.enableTravelZones || false);
          if (data.travelZones) setTravelZones(data.travelZones);
        }
      });
  }, [workspaceId]);

  // Update travel zone
  const updateZone = (id: number, field: keyof TravelZone, value: string | number) => {
    setTravelZones(zones => zones.map(zone => 
      zone.id === id ? { ...zone, [field]: value } : zone
    ));
  };

  // Handle CSV import
  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const zips = text
        .split(/[\n,;\t]+/)
        .map(zip => zip.trim().replace(/[^\d]/g, '').slice(0, 5))
        .filter(zip => /^\d{5}$/.test(zip))
        .join(', ');
      
      setZipCodes(prev => prev ? `${prev}, ${zips}` : zips);
    };
    reader.readAsText(file);
  };

  // Save settings
  const handleSave = async () => {
    setStatus("Saving...");
    
    const serviceAreaData = {
      baseAddress,
      serviceRadius,
      additionalCities,
      zipCodes,
      excludedAreas,
      excludedZipCodes,
      leadFilteringMode,
      enableTravelZones,
      travelZones
    };

    try {
      // Try saving to API (when implemented)
      await fetch(`/api/workspaces/${workspaceId}/service-area`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serviceAreaData),
      });
      
      // Also save to localStorage as backup
      localStorage.setItem('onboarding_step3', JSON.stringify(serviceAreaData));
      
      setStatus("✓ Saved!");
      setTimeout(() => setStatus(""), 2000);
    } catch (error) {
      // Fallback to localStorage only
      localStorage.setItem('onboarding_step3', JSON.stringify(serviceAreaData));
      setStatus("✓ Saved locally!");
      setTimeout(() => setStatus(""), 2000);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🗺️</span>
          <h2 className="font-bold text-blue-900 text-lg">Service Area & Territory</h2>
        </div>
        <div className="flex items-center gap-3">
          {status && (
            <span className="text-sm text-green-600 font-medium">{status}</span>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {isExpanded ? '− Collapse' : '+ Expand'}
          </button>
        </div>
      </div>

      {!isExpanded ? (
        // Collapsed view - Summary only
        <div className="space-y-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="text-xs text-slate-600 mb-1">Base Location</div>
              <div className="text-sm font-semibold text-slate-900 truncate">
                {baseAddress || '—'}
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="text-xs text-slate-600 mb-1">Service Radius</div>
              <div className="text-sm font-semibold text-blue-700">
                {serviceRadius} miles
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="text-xs text-slate-600 mb-1">Cities + ZIPs</div>
              <div className="text-sm font-semibold text-blue-700">
                {citiesList.length + zipCodesList.length}
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="text-xs text-slate-600 mb-1">Lead Filtering</div>
              <div className="text-sm font-semibold text-slate-900">
                {leadFilteringMode === 'reject' && '🚫 Auto-reject'}
                {leadFilteringMode === 'fee' && '💰 Apply fee'}
                {leadFilteringMode === 'manual' && '👁️ Manual'}
              </div>
            </div>
          </div>
          <p className="text-xs text-blue-700 mt-2">
            ℹ️ Your service area determines lead routing, pricing zones, and estimate calculations. Click <strong>+ Expand</strong> to modify.
          </p>
        </div>
      ) : (
        // Expanded view - Full editing
        <div className="space-y-6">
          {/* Base Location */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span>🏢</span>
              <span>Base Location</span>
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-slate-700">
                  Business Headquarters Address *
                </label>
                <input
                  type="text"
                  value={baseAddress}
                  onChange={(e) => setBaseAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123 Main Street, Los Angeles, CA 90001"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-slate-700">
                    Service Radius (miles) *
                  </label>
                  <input
                    type="number"
                    value={serviceRadius}
                    onChange={(e) => setServiceRadius(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    max="500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Travel Zones */}
          <div className="pt-4 border-t border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span>📏</span>
                <span>Tiered Travel Zones</span>
              </h3>
              <button
                type="button"
                onClick={() => setEnableTravelZones(!enableTravelZones)}
                className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
                  enableTravelZones
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {enableTravelZones ? '✓ Enabled' : 'Enable'}
              </button>
            </div>
            {enableTravelZones && (
              <div className="space-y-2">
                {travelZones.map((zone) => (
                  <div key={zone.id} className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200">
                    <input
                      type="text"
                      value={zone.name}
                      onChange={(e) => updateZone(zone.id, 'name', e.target.value)}
                      className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded"
                      placeholder="Zone Name"
                    />
                    <input
                      type="number"
                      value={zone.minMiles}
                      onChange={(e) => updateZone(zone.id, 'minMiles', parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 text-xs border border-slate-300 rounded text-center"
                    />
                    <span className="text-xs text-slate-500">–</span>
                    <input
                      type="number"
                      value={zone.maxMiles}
                      onChange={(e) => updateZone(zone.id, 'maxMiles', parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 text-xs border border-slate-300 rounded text-center"
                    />
                    <span className="text-xs text-slate-500">mi</span>
                    <span className="text-xs text-slate-500">$</span>
                    <input
                      type="number"
                      value={zone.fee}
                      onChange={(e) => updateZone(zone.id, 'fee', e.target.value)}
                      className="w-20 px-2 py-1 text-xs border border-slate-300 rounded"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cities & ZIP Codes */}
          <div className="pt-4 border-t border-blue-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span>📍</span>
              <span>Additional Coverage</span>
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-slate-700">
                  Additional Cities
                </label>
                <textarea
                  value={additionalCities}
                  onChange={(e) => setAdditionalCities(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="One city per line"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-slate-700">
                  ZIP Codes (comma/space separated)
                </label>
                <textarea
                  value={zipCodes}
                  onChange={(e) => setZipCodes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  rows={3}
                  placeholder="90001, 90002, 90003"
                />
              </div>
            </div>
          </div>

          {/* Excluded Areas */}
          <div className="pt-4 border-t border-blue-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span>🚫</span>
              <span>Excluded Areas</span>
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-slate-700">
                  Excluded Neighborhoods
                </label>
                <textarea
                  value={excludedAreas}
                  onChange={(e) => setExcludedAreas(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-red-50/30"
                  rows={2}
                  placeholder="Areas you don't serve"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-slate-700">
                  Excluded ZIP Codes
                </label>
                <textarea
                  value={excludedZipCodes}
                  onChange={(e) => setExcludedZipCodes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-red-50/30 font-mono"
                  rows={2}
                  placeholder="90001, 90002"
                />
              </div>
            </div>
          </div>

          {/* Lead Filtering */}
          <div className="pt-4 border-t border-blue-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span>📊</span>
              <span>Lead Filtering Logic</span>
            </h3>
            <div className="space-y-2">
              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer text-sm ${
                leadFilteringMode === 'reject' ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white'
              }`}>
                <input
                  type="radio"
                  name="leadFiltering"
                  value="reject"
                  checked={leadFilteringMode === 'reject'}
                  onChange={(e) => setLeadFilteringMode(e.target.value as 'reject')}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-semibold">🚫 Auto-reject out-of-area leads</div>
                  <div className="text-xs text-slate-600">Automatically decline leads outside service area</div>
                </div>
              </label>
              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer text-sm ${
                leadFilteringMode === 'fee' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'
              }`}>
                <input
                  type="radio"
                  name="leadFiltering"
                  value="fee"
                  checked={leadFilteringMode === 'fee'}
                  onChange={(e) => setLeadFilteringMode(e.target.value as 'fee')}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-semibold">💰 Apply out-of-area fee</div>
                  <div className="text-xs text-slate-600">Accept but add travel fees automatically</div>
                </div>
              </label>
              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer text-sm ${
                leadFilteringMode === 'manual' ? 'border-purple-500 bg-purple-50' : 'border-slate-200 bg-white'
              }`}>
                <input
                  type="radio"
                  name="leadFiltering"
                  value="manual"
                  checked={leadFilteringMode === 'manual'}
                  onChange={(e) => setLeadFilteringMode(e.target.value as 'manual')}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-semibold">👁️ Manual approval required</div>
                  <div className="text-xs text-slate-600">Review each out-of-area lead individually</div>
                </div>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <button
              onClick={handleSave}
              className="w-full md:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Save Service Area Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
