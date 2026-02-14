"use client";

export default function OnboardingStep7Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lead Intake</h1>
        <p className="text-gray-600 mt-2">Configure how you receive and manage leads</p>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Lead Sources</h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input type="checkbox" defaultChecked />
              <span>Website Contact Form</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" defaultChecked />
              <span>Phone Calls</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" />
              <span>Email</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
