"use client";
import { useState } from "react";

const COMMON_SERVICES = [
  "Hardwood Installation",
  "Tile & Stone",
  "Carpet Installation",
  "Vinyl & LVP",
  "Laminate",
  "Refinishing",
  "Repair",
];

export default function OnboardingStep5Page() {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
  const toggleService = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Services</h1>
        <p className="text-gray-600 mt-2">What services do you offer?</p>
      </div>
      
      <div className="space-y-3">
        {COMMON_SERVICES.map(service => (
          <label key={service} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedServices.includes(service)}
              onChange={() => toggleService(service)}
              className="w-5 h-5"
            />
            <span className="text-sm font-medium">{service}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
