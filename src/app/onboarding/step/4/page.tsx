"use client";
import { useState, useEffect } from "react";

export default function OnboardingStep4Page() {
  const [teamSize, setTeamSize] = useState("");
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Autosave functionality
  useEffect(() => {
    if (!teamSize) return;
    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        localStorage.setItem('onboarding_step4', JSON.stringify({ teamSize }));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Save failed:', error);
        setSaveStatus('idle');
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [teamSize]);
  
  // Load saved data
  useEffect(() => {
    try {
      const saved = localStorage.getItem('onboarding_step4');
      if (saved) {
        const data = JSON.parse(saved);
        setTeamSize(data.teamSize || '');
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
            <h1 className="text-2xl font-bold">Team Setup</h1>
            <p className="text-gray-600 mt-2">Configure your team structure</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-blue-600">Step 4 of 11</div>
            <div className="text-xs text-slate-500 mt-1">36% Complete</div>
            {saveStatus === 'saved' && (
              <div className="text-xs text-green-600 mt-2 flex items-center justify-end gap-1 transition-opacity duration-300">
                <span>✔</span>
                <span className="font-medium">Saved</span>
              </div>
            )}
          </div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: '36%' }} />
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Team Size</label>
          <select
            value={teamSize}
            onChange={(e) => setTeamSize(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="">Select team size</option>
            <option value="1-5">1-5 people</option>
            <option value="6-10">6-10 people</option>
            <option value="11-25">11-25 people</option>
            <option value="26+">26+ people</option>
          </select>
        </div>
        
        <div>
          <p className="text-sm text-gray-600 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            💡 You'll be able to invite team members and assign roles after completing onboarding.
          </p>
        </div>
      </div>
    </div>
  );
}
