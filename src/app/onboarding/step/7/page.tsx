"use client";
import { useState, useEffect } from "react";

export default function OnboardingStep7Page() {
  const [websiteForm, setWebsiteForm] = useState(true);
  const [phoneCalls, setPhoneCalls] = useState(true);
  const [emailSource, setEmailSource] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Autosave functionality
  useEffect(() => {
    const formData = { websiteForm, phoneCalls, emailSource };
    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        localStorage.setItem('onboarding_step7', JSON.stringify(formData));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Save failed:', error);
        setSaveStatus('idle');
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [websiteForm, phoneCalls, emailSource]);
  
  // Load saved data
  useEffect(() => {
    try {
      const saved = localStorage.getItem('onboarding_step7');
      if (saved) {
        const data = JSON.parse(saved);
        setWebsiteForm(data.websiteForm ?? true);
        setPhoneCalls(data.phoneCalls ?? true);
        setEmailSource(data.emailSource ?? false);
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
            <h1 className="text-2xl font-bold">Lead Intake</h1>
            <p className="text-gray-600 mt-2">Configure how you receive and manage leads</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-blue-600">Step 7 of 11</div>
            <div className="text-xs text-slate-500 mt-1">64% Complete</div>
            {saveStatus === 'saved' && (
              <div className="text-xs text-green-600 mt-2 flex items-center justify-end gap-1 transition-opacity duration-300">
                <span>✔</span>
                <span className="font-medium">Saved</span>
              </div>
            )}
          </div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: '64%' }} />
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Lead Sources</h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={websiteForm} onChange={(e) => setWebsiteForm(e.target.checked)} />
              <span>Website Contact Form</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={phoneCalls} onChange={(e) => setPhoneCalls(e.target.checked)} />
              <span>Phone Calls</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={emailSource} onChange={(e) => setEmailSource(e.target.checked)} />
              <span>Email</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
