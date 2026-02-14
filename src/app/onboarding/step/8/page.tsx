"use client";

export default function OnboardingStep8Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Estimate Workflow</h1>
        <p className="text-gray-600 mt-2">Set up your estimation process</p>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Estimate Template</h3>
          <p className="text-sm text-gray-600 mb-3">
            Choose your default estimate format
          </p>
          <select className="w-full px-4 py-2 border rounded-lg">
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
