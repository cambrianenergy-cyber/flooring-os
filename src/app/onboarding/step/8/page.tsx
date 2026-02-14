"use client";
import { useState, useEffect } from "react";

export default function OnboardingStep8Page() {
  const [template, setTemplate] = useState("Standard Template");
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Autosave functionality
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        localStorage.setItem('onboarding_step8', JSON.stringify({ template }));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Save failed:', error);
        setSaveStatus('idle');
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [template]);
  
  // Load saved data
  useEffect(() => {
    try {
      const saved = localStorage.getItem('onboarding_step8');
      if (saved) {
        const data = JSON.parse(saved);
        setTemplate(data.template || "Standard Template");
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
            <h1 className="text-2xl font-bold">Estimate Workflow</h1>
            <p className="text-gray-600 mt-2">Set up your estimation process</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-blue-600">Step 8 of 11</div>
            <div className="text-xs text-slate-500 mt-1">73% Complete</div>
            {saveStatus === 'saved' && (
              <div className="text-xs text-green-600 mt-2 flex items-center justify-end gap-1 transition-opacity duration-300">
                <span>✔</span>
                <span className="font-medium">Saved</span>
              </div>
            )}
          </div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: '73%' }} />
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Estimate Template</h3>
          <p className="text-sm text-gray-600 mb-3">
            Choose your default estimate format
          </p>
          <select value={template} onChange={(e) => setTemplate(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
            <option>Standard Template</option>
            <option>Detailed Template</option>
            <option>Simple Quote</option>
          </select>
        </div>
        
        <div className="text-sm text-gray-600 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          💡 You can customize templates and create new ones later.
        </div>
      </div>
    </div>
  );
}
