"use client";
import { useState, useEffect } from "react";

interface TravelZone {
  id: number;
  name: string;
  minMiles: number;
  maxMiles: number;
  fee: string;
}

export default function OnboardingStep3Page() {
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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showTravelZones, setShowTravelZones] = useState(false);
  const [newCity, setNewCity] = useState("");
  const [newZip, setNewZip] = useState("");
  
  // Parse cities for map preview
  const citiesList = additionalCities
    .split('\n')
    .map(city => city.trim())
    .filter(city => city.length > 0);
  
  // Parse ZIP codes
  const zipCodesList = zipCodes
    .split(/[\n,\s]+/)
    .map(zip => zip.trim())
    .filter(zip => /^\d{5}$/.test(zip));
  
  // Parse excluded areas
  const excludedAreasList = excludedAreas
    .split('\n')
    .map(area => area.trim())
    .filter(area => area.length > 0);
  
  const excludedZipCodesList = excludedZipCodes
    .split(/[\n,\s]+/)
    .map(zip => zip.trim())
    .filter(zip => /^\d{5}$/.test(zip));
  
  const totalCities = citiesList.length + (baseAddress ? 1 : 0);
  
  // Add/remove city
  const addCity = () => {
    if (newCity.trim()) {
      const cities = citiesList.includes(newCity.trim()) ? citiesList : [...citiesList, newCity.trim()];
      setAdditionalCities(cities.join('\n'));
      setNewCity('');
    }
  };

  const removeCity = (city: string) => {
    const cities = citiesList.filter(c => c !== city);
    setAdditionalCities(cities.join('\n'));
  };

  // Add/remove ZIP
  const addZip = () => {
    const cleaned = newZip.trim().replace(/[^\d]/g, '').slice(0, 5);
    if (/^\d{5}$/.test(cleaned) && !zipCodesList.includes(cleaned)) {
      setZipCodes([...zipCodesList, cleaned].join(', '));
      setNewZip('');
    }
  };

  const removeZip = (zip: string) => {
    const zips = zipCodesList.filter(z => z !== zip);
    setZipCodes(zips.join(', '));
  };
  
  // Autosave functionality
  useEffect(() => {
    const formData = { baseAddress, serviceRadius, additionalCities, zipCodes, excludedAreas, excludedZipCodes, leadFilteringMode, enableTravelZones, travelZones };
    const hasData = Object.values(formData).some(val => val !== '' && val !== false);
    if (!hasData) return;
    
    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        localStorage.setItem('onboarding_step3', JSON.stringify(formData));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Save failed:', error);
        setSaveStatus('idle');
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [baseAddress, serviceRadius, additionalCities, zipCodes, excludedAreas, excludedZipCodes, leadFilteringMode, enableTravelZones, travelZones]);
  
  // Load saved data
  useEffect(() => {
    try {
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
    } catch (error) {
      console.error('Load failed:', error);
    }
  }, []);
  
  // Update travel zone
  const updateZone = (id: number, field: keyof TravelZone, value: string | number) => {
    setTravelZones(zones => zones.map(zone => 
      zone.id === id ? { ...zone, [field]: value } : zone
    ));
  };
  
  // Handle CSV import for ZIP codes
  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      // Parse CSV - handle both comma and newline separated values
      const zips = text
        .split(/[\n,;\t]+/)
        .map(zip => zip.trim().replace(/[^\d]/g, '').slice(0, 5))
        .filter(zip => /^\d{5}$/.test(zip))
        .join(', ');
      
      setZipCodes(prev => prev ? `${prev}, ${zips}` : zips);
    };
    reader.readAsText(file);
  };
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column - Form */}
        <div className="flex-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-8">
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold">Service Area</h1>
                  <p className="text-gray-600 mt-2">Define your service territory</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-blue-600">Step 3 of 11</div>
                  <div className="text-xs text-slate-500 mt-1">27% Complete</div>
                  {saveStatus === 'saved' && (
                    <div className="text-xs text-green-600 mt-2 flex items-center justify-end gap-1 transition-opacity duration-300">
                      <span>✔</span>
                      <span className="font-medium">Saved</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: '27%' }} />
              </div>
            </div>

            {/* Map Preview */}
            {baseAddress && (
              <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <span>🗺️</span>
                    <span>Territory Map</span>
                  </h3>
                  <div className="relative rounded-lg overflow-hidden border border-slate-200">
                    <iframe
                      width="100%"
                      height="250"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(baseAddress)}&zoom=${Math.max(8, 14 - Math.floor(parseInt(serviceRadius) / 10))}`}
                    />
                    <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-200 shadow-md">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                          <span className="text-slate-700 font-medium truncate">{baseAddress.substring(0, 35)}...</span>
                        </div>
                        <span className="text-blue-600 font-semibold">{serviceRadius} mi</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Headquarters Location */}
            <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center mb-4">
                <span className="text-xl mr-2">📍</span>
                <h2 className="text-base font-semibold text-slate-900">Headquarters Location</h2>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700">Address</label>
                <input
                  type="text"
                  value={baseAddress}
                  onChange={(e) => setBaseAddress(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                  placeholder="123 Main Street, Los Angeles, CA 90001"
                />
              </div>
            </div>

            {/* Service Radius Slider */}
            <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center mb-4">
                <span className="text-xl mr-2">📏</span>
                <h2 className="text-base font-semibold text-slate-900">Service Radius</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-600">Coverage Area</span>
                  <span className="text-lg font-bold text-blue-600">{serviceRadius} miles</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={serviceRadius}
                  onChange={(e) => setServiceRadius(e.target.value)}
                  className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:bg-blue-700 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md hover:[&::-moz-range-thumb]:bg-blue-700"
                />
                <div className="flex justify-between text-xs text-slate-500 px-1">
                  <span>0</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100</span>
                </div>
              </div>
            </div>

            {/* Base Location Section */}
            <div className="mb-6" style={{display: 'none'}}>
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-2">🏢</span>
                <h2 className="text-lg font-semibold text-slate-900">Base Location</h2>
              </div>
              
              <div className="space-y-4" style={{display: 'none'}}>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Business Headquarters Address *</label>
                  <input
                    type="text"
                    value={baseAddress}
                    onChange={(e) => setBaseAddress(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="123 Main Street, Los Angeles, CA 90001"
                  />
                  <p className="mt-1.5 text-xs text-slate-500">Your primary business address. This is the center point for your service radius.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Service Radius *</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={serviceRadius}
                      onChange={(e) => setServiceRadius(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-16"
                      placeholder="25"
                      min="1"
                      max="500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">miles</span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">How far from your headquarters do you travel for jobs? (e.g., "{serviceRadius} miles from {baseAddress || 'your location'}")</p>
                </div>
              </div>
            </div>

            {/* Cities & Regions (Tag-based) */}
            <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center mb-4">
                <span className="text-xl mr-2">🏙</span>
                <h2 className="text-base font-semibold text-slate-900">Cities & Regions</h2>
              </div>
              <div className="space-y-4">
                {/* Cities */}
                <div>
                  <label className="block text-xs font-medium mb-2 text-slate-700">Additional Cities</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {citiesList.map((city, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 text-sm"
                      >
                        <span>{city}</span>
                        <button
                          type="button"
                          onClick={() => removeCity(city)}
                          className="text-blue-500 hover:text-blue-700 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCity();
                          }
                        }}
                        placeholder="Type city name"
                        className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
                      />
                      <button
                        type="button"
                        onClick={addCity}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">Press Enter or click + to add</p>
                </div>

                {/* ZIP Codes */}
                <div>
                  <label className="block text-xs font-medium mb-2 text-slate-700">ZIP Codes</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {zipCodesList.map((zip, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 text-sm font-mono"
                      >
                        <span>{zip}</span>
                        <button
                          type="button"
                          onClick={() => removeZip(zip)}
                          className="text-purple-500 hover:text-purple-700 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newZip}
                        onChange={(e) => setNewZip(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addZip();
                          }
                        }}
                        placeholder="12345"
                        maxLength={5}
                        className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono min-w-[100px]"
                      />
                      <button
                        type="button"
                        onClick={addZip}
                        className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">5-digit US ZIP codes only</p>
                </div>
              </div>
            </div>

            {/* OLD Additional Cities and ZIP Section - HIDDEN */}
            <div className="mb-6" style={{display: 'none'}}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">🗺️</span>
                  <h2 className="text-lg font-semibold text-slate-900">Additional Cities</h2>
                </div>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Optional</span>
              </div>
              
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <button
                      type="button"
                      onClick={() => setEnableTravelZones(!enableTravelZones)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        enableTravelZones ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                      role="switch"
                      aria-checked={enableTravelZones}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          enableTravelZones ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900 mb-1">Enable Tiered Travel Pricing</div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Automatically adjust estimate prices based on distance from your headquarters. Perfect for managing profitability across your service area.
                    </p>
                  </div>
                </div>
              </div>
              
              {enableTravelZones && (
                <div className="space-y-3">
                  {travelZones.map((zone) => (
                    <div key={zone.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <input
                          type="text"
                          value={zone.name}
                          onChange={(e) => updateZone(zone.id, 'name', e.target.value)}
                          className="flex-1 px-3 py-1.5 text-sm font-semibold border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Zone Name"
                        />
                        <span className="text-xs text-slate-500 font-medium">Travel Fee:</span>
                        <div className="relative w-28">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">$</span>
                          <input
                            type="number"
                            value={zone.fee}
                            onChange={(e) => updateZone(zone.id, 'fee', e.target.value)}
                            className="w-full pl-6 pr-3 py-1.5 text-sm font-bold border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                            min="0"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="number"
                            value={zone.minMiles}
                            onChange={(e) => updateZone(zone.id, 'minMiles', parseInt(e.target.value) || 0)}
                            className="w-20 px-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                            min="0"
                          />
                          <span className="text-xs text-slate-500">to</span>
                          <input
                            type="number"
                            value={zone.maxMiles}
                            onChange={(e) => updateZone(zone.id, 'maxMiles', parseInt(e.target.value) || 0)}
                            className="w-20 px-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                            min="0"
                          />
                          <span className="text-xs text-slate-500 font-medium">miles from base</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-800 leading-relaxed">
                      ✅ <strong>Smart Pricing Active:</strong> Estimates will automatically include travel fees based on customer location. This improves profitability and helps you qualify leads upfront.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Cities Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">🗺️</span>
                  <h2 className="text-lg font-semibold text-slate-900">Additional Cities</h2>
                </div>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Optional</span>
              </div>
            {/* Travel Fees (Accordion) */}
            <div className="mb-6 bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
              <button
                type="button"
                onClick={() => setShowTravelZones(!showTravelZones)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">💰</span>
                  <h2 className="text-base font-semibold text-slate-900">Travel Fees</h2>
                  <span className="text-xs text-slate-500">(Optional)</span>
                  {enableTravelZones && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">Active</span>
                  )}
                </div>
                <span className="text-slate-400">{showTravelZones ? '−' : '+'}</span>
              </button>
              
              {showTravelZones && (
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-600">Add distance-based fees for jobs outside your base radius</p>
                    <button
                      type="button"
                      onClick={() => setEnableTravelZones(!enableTravelZones)}
                      className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
                        enableTravelZones
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {enableTravelZones ? '✓ Enabled' : 'Enable'}
                    </button>
                  </div>
                  {enableTravelZones && (
                    <div className="space-y-2">
                      {travelZones.map((zone) => (
                        <div key={zone.id} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200">
                          <input
                            type="text"
                            value={zone.name}
                            onChange={(e) => updateZone(zone.id, 'name', e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded"
                            placeholder="Zone Name"
                          />
                          <input
                            type="number"
                            value={zone.minMiles}
                            onChange={(e) => updateZone(zone.id, 'minMiles', parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1.5 text-xs border border-slate-300 rounded text-center"
                          />
                          <span className="text-xs text-slate-500">–</span>
                          <input
                            type="number"
                            value={zone.maxMiles}
                            onChange={(e) => updateZone(zone.id, 'maxMiles', parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1.5 text-xs border border-slate-300 rounded text-center"
                          />
                          <span className="text-xs text-slate-500">mi</span>
                          <span className="text-xs text-slate-500">$</span>
                          <input
                            type="number"
                            value={zone.fee}
                            onChange={(e) => updateZone(zone.id, 'fee', e.target.value)}
                            className="w-20 px-2 py-1.5 text-xs border border-slate-300 rounded"
                            placeholder="0"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* OLD Travel Zones Section - HIDDEN */}
            <div className="mb-6" style={{display: 'none'}}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">📏</span>
                  <h2 className="text-lg font-semibold text-slate-900">Travel Zones</h2>
                </div>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Optional • Intelligent Pricing</span>
              </div>
            </div>
            {/* OLD Sections Below - HIDDEN */}
            <div style={{display: 'none'}}>
            {/* ZIP Code Targeting Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">📍</span>
                  <h2 className="text-lg font-semibold text-slate-900">ZIP Code Targeting</h2>
                </div>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Optional • Precise Coverage</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">ZIP Codes You Serve</label>
                  <textarea
                    value={zipCodes}
                    onChange={(e) => setZipCodes(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
                    rows={4}
                    placeholder="90001, 90002, 90003, 90004, 90005&#10;90006, 90007, 90008, 90009, 90010&#10;Paste multiple ZIPs separated by commas, spaces, or new lines"
                  />
                  <p className="mt-1.5 text-xs text-slate-500">Bulk paste ZIP codes separated by commas, spaces, or line breaks. Only 5-digit US ZIP codes will be recognized.</p>
                </div>
                
                {/* CSV Import */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label
                      htmlFor="csv-upload"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-all cursor-pointer"
                    >
                      <span>📄</span>
                      <span>Import from CSV</span>
                    </label>
                    <input
                      id="csv-upload"
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleCSVImport}
                      className="hidden"
                    />
                  </div>
                  {zipCodesList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setZipCodes('')}
                      className="px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                
                {/* ZIP Code Pills Display */}
                {zipCodesList.length > 0 && (
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-700">
                        {zipCodesList.length} ZIP Code{zipCodesList.length !== 1 ? 's' : ''} Added
                      </span>
                      <span className="text-xs text-slate-500">Auto-validated</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {zipCodesList.map((zip, index) => (
                        <span key={index} className="inline-flex items-center gap-1 text-xs font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200">
                          {zip}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-purple-800 leading-relaxed">
                    🎯 <strong>Pro tip:</strong> Contractors think in ZIP codes. This precise targeting helps with lead qualification, routing efficiency, and accurate service area mapping.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Excluded Areas Section */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">🚫</span>
                  <h2 className="text-lg font-semibold text-slate-900">Excluded Areas</h2>
                </div>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Optional • Quality Control</span>
              </div>
              
              <div className="p-4 bg-red-50 rounded-lg border border-red-200 mb-4">
                <p className="text-xs text-red-800 leading-relaxed">
                  <strong>⚠️ Service Area Exclusions:</strong> Specify neighborhoods or ZIP codes you prefer not to serve. These will be automatically filtered from lead routing and estimates.
                </p>
              </div>
              
              <div className="space-y-4">
                {/* Excluded Neighborhoods */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Excluded Neighborhoods/Cities</label>
                  <textarea
                    value={excludedAreas}
                    onChange={(e) => setExcludedAreas(e.target.value)}
                    className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-red-50/30"
                    rows={3}
                    placeholder="Downtown District&#10;Industrial Zone&#10;Specific areas you don't serve"
                  />
                  <p className="mt-1.5 text-xs text-slate-500">Enter one area per line. Leads from these areas will be filtered automatically.</p>
                </div>
                
                {/* Excluded ZIP Codes */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Excluded ZIP Codes</label>
                  <textarea
                    value={excludedZipCodes}
                    onChange={(e) => setExcludedZipCodes(e.target.value)}
                    className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-red-50/30 font-mono text-sm"
                    rows={3}
                    placeholder="90001, 90002, 90003"
                  />
                  <p className="mt-1.5 text-xs text-slate-500">Enter ZIP codes separated by commas, spaces, or line breaks. These areas will be blocked from service.</p>
                </div>
                
                {/* Excluded Areas Display */}
                {(excludedAreasList.length > 0 || excludedZipCodesList.length > 0) && (
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xs font-semibold text-red-600 mb-3 flex items-center gap-2">
                      <span>🚫</span>
                      <span>{excludedAreasList.length + excludedZipCodesList.length} Area{(excludedAreasList.length + excludedZipCodesList.length) !== 1 ? 's' : ''} Excluded</span>
                    </div>
                    
                    {excludedAreasList.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs text-slate-600 mb-1.5 font-medium">Excluded Neighborhoods:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {excludedAreasList.map((area, index) => (
                            <span key={index} className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded border border-red-200">
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {excludedZipCodesList.length > 0 && (
                      <div>
                        <div className="text-xs text-slate-600 mb-1.5 font-medium">Excluded ZIP Codes:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {excludedZipCodesList.map((zip, index) => (
                            <span key={index} className="inline-flex items-center gap-1 text-xs font-mono bg-red-100 text-red-700 px-2 py-1 rounded border border-red-200">
                              {zip}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Lead Filtering Logic Section */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">📩</span>
                  <h2 className="text-lg font-semibold text-slate-900">Lead Filtering Logic</h2>
                </div>
                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded font-medium">🔗 Connects to Lead Intake</span>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200 mb-4">
                <p className="text-xs text-emerald-900 leading-relaxed">
                  <strong>🎯 Smart Lead Routing:</strong> Define how Square OS should handle leads from outside your defined service area. This connects directly to your Lead Intake system (Step 7).
                </p>
              </div>
              
              <div className="space-y-3">
                {/* Option 1: Auto-reject */}
                <label
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    leadFilteringMode === 'reject'
                      ? 'border-red-500 bg-red-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="leadFiltering"
                    value="reject"
                    checked={leadFilteringMode === 'reject'}
                    onChange={(e) => setLeadFilteringMode(e.target.value as 'reject')}
                    className="mt-1 w-4 h-4 text-red-600 focus:ring-2 focus:ring-red-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-900">Automatically Reject Out-of-Area Leads</span>
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">Strict</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Leads from outside your service area will be automatically declined. Saves time but may miss opportunities.
                    </p>
                  </div>
                </label>
                
                {/* Option 2: Apply fee */}
                <label
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    leadFilteringMode === 'fee'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="leadFiltering"
                    value="fee"
                    checked={leadFilteringMode === 'fee'}
                    onChange={(e) => setLeadFilteringMode(e.target.value as 'fee')}
                    className="mt-1 w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-900">Allow But Apply Out-of-Area Fee</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">Recommended</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Accept leads from extended areas but automatically add travel fees. Maximizes revenue while managing profitability.
                    </p>
                  </div>
                </label>
                
                {/* Option 3: Manual approval */}
                <label
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    leadFilteringMode === 'manual'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="leadFiltering"
                    value="manual"
                    checked={leadFilteringMode === 'manual'}
                    onChange={(e) => setLeadFilteringMode(e.target.value as 'manual')}
                    className="mt-1 w-4 h-4 text-purple-600 focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-900">Require Manual Approval</span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">Flexible</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Review each out-of-area lead individually before accepting. Full control but requires more time investment.
                    </p>
                  </div>
                </label>
              </div>
              
              {/* Active Policy Display */}
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {leadFilteringMode === 'reject' && <span className="text-2xl">🚫</span>}
                    {leadFilteringMode === 'fee' && <span className="text-2xl">💰</span>}
                    {leadFilteringMode === 'manual' && <span className="text-2xl">👁️</span>}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-700 mb-1">Active Policy:</div>
                    <div className="text-sm font-bold text-slate-900">
                      {leadFilteringMode === 'reject' && 'Auto-reject out-of-area leads'}
                      {leadFilteringMode === 'fee' && 'Accept with automatic travel fee adjustment'}
                      {leadFilteringMode === 'manual' && 'Manual review required for out-of-area leads'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
            {/* END OLD Sections - HIDDEN */}
          </div>
        </div>
        
        {/* Right Column - Map Preview */}
        <div className="lg:w-96 flex-shrink-0">
          <div className="sticky top-8">
            <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl border border-blue-200 p-6 shadow-lg">
              <div className="mb-4">
                <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Territory Preview</div>
                <p className="text-sm text-slate-600">This will appear on your estimates and service area page.</p>
              </div>
              
              {/* Map Container */}
              <div className="bg-white rounded-lg border-2 border-slate-200 overflow-hidden mb-4">
                {baseAddress ? (
                  <div className="relative">
                    {/* Embedded Google Maps */}
                    <iframe
                      width="100%"
                      height="300"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(baseAddress)}&zoom=${Math.max(8, 14 - Math.floor(parseInt(serviceRadius) / 10))}`}
                    ></iframe>
                    
                    {/* Overlay with service radius indicator */}
                    <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                        <span className="text-xs font-semibold text-slate-700 truncate">{baseAddress}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full border-2 border-blue-400 bg-blue-100"></div>
                        <span className="text-xs text-slate-600">{serviceRadius} mile radius from base</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-center p-6 bg-slate-50">
                    <div className="text-4xl mb-3">🗺️</div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Your Service Map</p>
                    <p className="text-xs text-slate-500">Enter your headquarters address to see the map preview</p>
                  </div>
                )}
              </div>
              
              {/* Service Territory Summary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-xs font-medium text-slate-600">Service Radius</span>
                  <span className="text-sm font-bold text-blue-600">{serviceRadius} miles</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-xs font-medium text-slate-600">Cities Covered</span>
                  <span className="text-sm font-bold text-blue-600">{totalCities || '—'}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-xs font-medium text-slate-600">ZIP Codes Targeted</span>
                  <span className="text-sm font-bold text-blue-600">{zipCodesList.length || '—'}</span>
                </div>
                
                {(excludedAreasList.length > 0 || excludedZipCodesList.length > 0) && (
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <span className="text-xs font-medium text-red-700">🚫 Excluded Areas</span>
                    <span className="text-sm font-bold text-red-600">{excludedAreasList.length + excludedZipCodesList.length}</span>
                  </div>
                )}
                
                {/* Lead Filtering Policy */}
                <div className={`p-3 rounded-lg border ${
                  leadFilteringMode === 'reject' ? 'bg-red-50 border-red-200' :
                  leadFilteringMode === 'fee' ? 'bg-blue-50 border-blue-200' :
                  'bg-purple-50 border-purple-200'
                }`}>
                  <div className="text-xs font-medium text-slate-600 mb-1.5">Lead Filtering:</div>
                  <div className={`text-xs font-bold ${
                    leadFilteringMode === 'reject' ? 'text-red-700' :
                    leadFilteringMode === 'fee' ? 'text-blue-700' :
                    'text-purple-700'
                  }`}>
                    {leadFilteringMode === 'reject' && '🚫 Auto-reject out-of-area'}
                    {leadFilteringMode === 'fee' && '💰 Apply travel fee'}
                    {leadFilteringMode === 'manual' && '👁️ Manual review'}
                  </div>
                </div>
                
                {citiesList.length > 0 && (
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <div className="text-xs font-medium text-slate-600 mb-2">Additional Cities:</div>
                    <div className="flex flex-wrap gap-1">
                      {citiesList.slice(0, 8).map((city, index) => (
                        <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          {city}
                        </span>
                      ))}
                      {citiesList.length > 8 && (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          +{citiesList.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Travel Zones Preview */}
              {enableTravelZones && travelZones.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-medium text-slate-600 mb-2">Travel Pricing Zones:</div>
                  <div className="space-y-2">
                    {travelZones.map((zone) => (
                      <div key={zone.id} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            zone.fee === '0' ? 'bg-green-500' : 'bg-blue-500'
                          }`}></div>
                          <span className="text-xs font-medium text-slate-700">{zone.name}</span>
                          <span className="text-xs text-slate-500">({zone.minMiles}–{zone.maxMiles} mi)</span>
                        </div>
                        <span className="text-xs font-bold text-slate-900">
                          {zone.fee === '0' ? 'No fee' : `+$${zone.fee}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-800 leading-relaxed">
                  💡 <strong>Pro tip:</strong> A clearly defined service area helps filter leads and set customer expectations upfront.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
