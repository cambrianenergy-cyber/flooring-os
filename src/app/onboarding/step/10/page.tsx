import React from "react";
"use client";
import { useState, useEffect } from "react";

export default function OnboardingStep10Page() {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // For step 10, we just show the saved indicator when they interact
  // You can expand this later to track which integrations are connected
  useEffect(() => {
    // Mark as saved immediately for this step since it's optional
    const saved = localStorage.getItem('onboarding_step10');
    if (!saved) {
      localStorage.setItem('onboarding_step10', JSON.stringify({ visited: true }));
    }
  }, []);
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Integrations</h1>
            <p className="text-gray-600 mt-2">Connect your tools</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-blue-600">Step 10 of 11</div>
            <div className="text-xs text-slate-500 mt-1">91% Complete</div>
            {saveStatus === 'saved' && (
              <div className="text-xs text-green-600 mt-2 flex items-center justify-end gap-1 transition-opacity duration-300">
                <span>✔</span>
                <span className="font-medium">Saved</span>
              </div>
            )}
          </div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: '91%' }} />
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="p-4 border rounded-lg flex items-center justify-between">
          <div>
            <h3 className="font-semibold">QuickBooks</h3>
            <p className="text-sm text-gray-600">Sync invoices and payments</p>
          </div>
          <button className="px-4 py-2 border rounded hover:bg-gray-50">
            Connect
          </button>
        </div>
        
        <div className="p-4 border rounded-lg flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Google Calendar</h3>
            <p className="text-sm text-gray-600">Sync appointments</p>
          </div>
          <button className="px-4 py-2 border rounded hover:bg-gray-50">
            Connect
          </button>
        </div>
        
        <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">
          You can skip this step and set up integrations later in Settings.
        </div>
      </div>
    </div>
  );
}
