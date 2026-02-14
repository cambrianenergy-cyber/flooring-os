import React from "react";
"use client";

export default function OnboardingStep10Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-gray-600 mt-2">Connect your tools</p>
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
