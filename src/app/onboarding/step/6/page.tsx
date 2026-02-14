"use client";
import { useState, useEffect } from "react";

export default function OnboardingStep6Page() {
  const [laborRate, setLaborRate] = useState("");
  const [markup, setMarkup] = useState("");
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Autosave functionality
  useEffect(() => {
    const formData = { laborRate, markup };
    const hasData = Object.values(formData).some(val => val !== '');
    if (!hasData) return;
    
    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        localStorage.setItem('onboarding_step6', JSON.stringify(formData));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Save failed:', error);
        setSaveStatus('idle');
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [laborRate, markup]);
  
  // Load saved data
  useEffect(() => {
    try {
      const saved = localStorage.getItem('onboarding_step6');
      if (saved) {
        const data = JSON.parse(saved);
        setLaborRate(data.laborRate || '');
        setMarkup(data.markup || '');
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
            <h1 className="text-2xl font-bold">Pricing Defaults</h1>
            <p className="text-gray-600 mt-2">Set your default pricing structure</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-blue-600">Step 6 of 11</div>
            <div className="text-xs text-slate-500 mt-1">55% Complete</div>
            {saveStatus === 'saved' && (
              <div className="text-xs text-green-600 mt-2 flex items-center justify-end gap-1 transition-opacity duration-300">
                <span>✔</span>
                <span className="font-medium">Saved</span>
              </div>
            )}
          </div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: '55%' }} />
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Default Labor Rate ($/hour)</label>
          <input
            type="number"
            value={laborRate}
            onChange={(e) => setLaborRate(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="75"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Material Markup (%)</label>
          <input
            type="number"
            value={markup}
            onChange={(e) => setMarkup(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="30"
          />
        </div>
        
        <div className="text-sm text-gray-600 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          💡 You can adjust these rates per job or customer later.
        </div>
      </div>
    </div>
  );
}
