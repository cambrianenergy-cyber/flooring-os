"use client";
import { useState } from "react";

export default function OnboardingStep3Page() {
  const [serviceArea, setServiceArea] = useState("");
  
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
            className="w-full px-4 py-2 border rounded-lg"
            rows={4}
            placeholder="Enter cities or regions you serve (one per line)"
          />
        </div>
      </div>
    </div>
  );
}
