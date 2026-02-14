"use client";

export default function OnboardingStep9Page() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Product Catalog</h1>
            <p className="text-gray-600 mt-2">Set up your material catalog</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-blue-600">Step 9 of 11</div>
            <div className="text-xs text-slate-500 mt-1">82% Complete</div>
          </div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: '82%' }} />
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Catalog Options</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input type="radio" name="catalog" defaultChecked />
              <div>
                <div className="font-medium">Start with defaults</div>
                <div className="text-sm text-gray-600">Pre-populated with common materials</div>
              </div>
            </label>
            <label className="flex items-center space-x-2">
              <input type="radio" name="catalog" />
              <div>
                <div className="font-medium">Import my catalog</div>
                <div className="text-sm text-gray-600">Upload from spreadsheet</div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
