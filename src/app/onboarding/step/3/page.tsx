"use client";
import { useState, useEffect } from "react";

export default function OnboardingStep3Page() {
  const [serviceArea, setServiceArea] = useState("");
  const [regions, setRegions] = useState("");
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Autosave functionality
  useEffect(() => {
    const formData = { serviceArea, regions };
    const hasData = Object.values(formData).some(val => val !== '');
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
  }, [serviceArea, regions]);
  
  // Load saved data
  useEffect(() => {
    try {
      const saved = localStorage.getItem('onboarding_step3');
      if (saved) {
        const data = JSON.parse(saved);
        setServiceArea(data.serviceArea || '');
        setRegions(data.regions || '');
      }
    } catch (error) {
      console.error('Load failed:', error);
    }
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Service Area</h1>
            <p className="text-gray-600 mt-2">Where do you operate?</p>
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
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Service Radius *</label>
          <input
            type="text"
            value={serviceArea}
            onChange={(e) => setServiceArea(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="e.g., 50 miles from downtown"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Cities/Regions</label>
          <textarea
            value={regions}
            onChange={(e) => setRegions(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            rows={4}
            placeholder="Enter cities or regions you serve (one per line)"
          />
        </div>
      </div>
    </div>
  );
}
