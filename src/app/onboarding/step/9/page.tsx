"use client";
import { useState, useEffect } from "react";

export default function OnboardingStep9Page() {
  const [catalogOption, setCatalogOption] = useState("defaults");
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Autosave functionality
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        localStorage.setItem('onboarding_step9', JSON.stringify({ catalogOption }));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Save failed:', error);
        setSaveStatus('idle');
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [catalogOption]);
  
  // Load saved data
  useEffect(() => {
    try {
      const saved = localStorage.getItem('onboarding_step9');
      if (saved) {
        const data = JSON.parse(saved);
        setCatalogOption(data.catalogOption || "defaults");
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
            <h1 className="text-2xl font-bold">Product Catalog</h1>
            <p className="text-gray-600 mt-2">Set up your material catalog</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-blue-600">Step 9 of 11</div>
            <div className="text-xs text-slate-500 mt-1">82% Complete</div>
            {saveStatus === 'saved' && (
              <div className="text-xs text-green-600 mt-2 flex items-center justify-end gap-1 transition-opacity duration-300">
                <span>✔</span>
                <span className="font-medium">Saved</span>
              </div>
            )}
          </div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: '82%' }} />
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Catalog Options</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input type="radio" name="catalog" checked={catalogOption === "defaults"} onChange={() => setCatalogOption("defaults")} />
              <div>
                <div className="font-medium">Start with defaults</div>
                <div className="text-sm text-gray-600">Pre-populated with common materials</div>
              </div>
            </label>
            <label className="flex items-center space-x-2">
              <input type="radio" name="catalog" checked={catalogOption === "import"} onChange={() => setCatalogOption("import")} />
              <div>
                <div className="font-medium">Import my catalog</div>
                <div className="text-sm text-gray-600">Upload from spreadsheet</div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
