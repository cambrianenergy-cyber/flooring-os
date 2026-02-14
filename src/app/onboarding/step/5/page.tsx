"use client";
import { useState, useEffect } from "react";

const COMMON_SERVICES = [
  "Hardwood Installation",
  "Tile & Stone",
  "Carpet Installation",
  "Vinyl & LVP",
  "Laminate",
  "Refinishing",
  "Repair",
];

export default function OnboardingStep5Page() {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Autosave functionality
  useEffect(() => {
    if (selectedServices.length === 0) return;
    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        localStorage.setItem('onboarding_step5', JSON.stringify({ selectedServices }));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Save failed:', error);
        setSaveStatus('idle');
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [selectedServices]);
  
  // Load saved data
  useEffect(() => {
    try {
      const saved = localStorage.getItem('onboarding_step5');
      if (saved) {
        const data = JSON.parse(saved);
        setSelectedServices(data.selectedServices || []);
      }
    } catch (error) {
      console.error('Load failed:', error);
    }
  }, []);
  
  const toggleService = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Services</h1>
            <p className="text-gray-600 mt-2">What services do you offer?</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-blue-600">Step 5 of 11</div>
            <div className="text-xs text-slate-500 mt-1">45% Complete</div>
            {saveStatus === 'saved' && (
              <div className="text-xs text-green-600 mt-2 flex items-center justify-end gap-1 transition-opacity duration-300">
                <span>✔</span>
                <span className="font-medium">Saved</span>
              </div>
            )}
          </div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: '45%' }} />
        </div>
      </div>
      
      <div className="space-y-3">
        {COMMON_SERVICES.map(service => (
          <label key={service} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedServices.includes(service)}
              onChange={() => toggleService(service)}
              className="w-5 h-5"
            />
            <span className="text-sm font-medium">{service}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
