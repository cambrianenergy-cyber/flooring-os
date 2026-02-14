"use client";
import { useState } from "react";

export default function OnboardingStep6Page() {
  const [laborRate, setLaborRate] = useState("");
  const [markup, setMarkup] = useState("");
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pricing Defaults</h1>
        <p className="text-gray-600 mt-2">Set your default pricing structure</p>
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
