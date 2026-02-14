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
  const [enableTravelZones, setEnableTravelZones] = useState(false);
  const [travelZones, setTravelZones] = useState<TravelZone[]>([
    { id: 1, name: "Zone 1", minMiles: 0, maxMiles: 25, fee: "0" },
    { id: 2, name: "Zone 2", minMiles: 25, maxMiles: 50, fee: "150" },
    { id: 3, name: "Zone 3", minMiles: 50, maxMiles: 75, fee: "300" },
  ]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Parse cities for map preview
  const citiesList = additionalCities
    .split('\n')
    .map(city => city.trim())
    .filter(city => city.length > 0);
  
  const totalCities = citiesList.length + (baseAddress ? 1 : 0);
  
  // Autosave functionality
  useEffect(() => {
    const formData = { baseAddress, serviceRadius, additionalCities, enableTravelZones, travelZones };
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
  }, [baseAddress, serviceRadius, additionalCities, enableTravelZones, travelZones]);
  
  // Load saved data
  useEffect(() => {
    try {
      const saved = localStorage.getItem('onboarding_step3');
      if (saved) {
        const data = JSON.parse(saved);
        setBaseAddress(data.baseAddress || '');
        setServiceRadius(data.serviceRadius || '25');
        setAdditionalCities(data.additionalCities || '');
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

            {/* Base Location Section */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-2">🏢</span>
                <h2 className="text-lg font-semibold text-slate-900">Base Location</h2>
              </div>
              
              <div className="space-y-4">
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

            {/* Travel Zones Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">📏</span>
                  <h2 className="text-lg font-semibold text-slate-900">Travel Zones</h2>
                </div>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Optional • Intelligent Pricing</span>
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
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">🗺️</span>
                  <h2 className="text-lg font-semibold text-slate-900">Additional Cities</h2>
                </div>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Optional</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">Cities/Regions You Serve</label>
                <textarea
                  value={additionalCities}
                  onChange={(e) => setAdditionalCities(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  rows={6}
                  placeholder="Santa Monica&#10;Beverly Hills&#10;Pasadena&#10;Long Beach&#10;Glendale"
                />
                <p className="mt-1.5 text-xs text-slate-500">Enter one city per line. These will be highlighted on your service map.</p>
              </div>
            </div>
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
