"use client";
import { useState } from "react";

export default function OnboardingStep3Page() {
  const [serviceArea, setServiceArea] = useState("");
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Service Area</h1>
        <p className="text-gray-600 mt-2">Where do you operate?</p>
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
