import React from "react";
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function OnboardingStep2Page() {
  const { user } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [ein, setEin] = useState("");
  const [website, setWebsite] = useState("");
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Founder Mode: Advanced settings
  const [multiLocationEnabled, setMultiLocationEnabled] = useState(false);
  const [enterpriseConfigEnabled, setEnterpriseConfigEnabled] = useState(false);
  
  // Check if user is a founder (can be enhanced with custom claims or Firestore role check)
  const isFounder = user?.email?.includes('finan') || user?.email?.includes('cambrian') || user?.email?.endsWith('@squareos.com') || false;
  
  // Autosave functionality with debouncing
  useEffect(() => {
    const formData = { 
      companyName, phone, email, address, city, state, zip, licenseNumber, ein, website,
      multiLocationEnabled, enterpriseConfigEnabled
    };
    const hasData = Object.values(formData).some(val => val !== '' && val !== false);
    
    if (!hasData) return;
    
    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      // Simulate save to backend/localStorage
      try {
        localStorage.setItem('onboarding_step2', JSON.stringify(formData));
        setSaveStatus('saved');
        
        // Reset to idle after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Save failed:', error);
        setSaveStatus('idle');
      }
    }, 1000); // 1 second debounce
    
    return () => clearTimeout(timer);
  }, [companyName, phone, email, address, city, state, zip, licenseNumber, ein, website, multiLocationEnabled, enterpriseConfigEnabled]);
  
  // Load saved data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('onboarding_step2');
      if (saved) {
        const data = JSON.parse(saved);
        setCompanyName(data.companyName || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setAddress(data.address || '');
        setCity(data.city || '');
        setState(data.state || '');
        setZip(data.zip || '');
        setLicenseNumber(data.licenseNumber || '');
        setEin(data.ein || '');
        setWebsite(data.website || '');
        setMultiLocationEnabled(data.multiLocationEnabled || false);
        setEnterpriseConfigEnabled(data.enterpriseConfigEnabled || false);
      }
    } catch (error) {
      console.error('Load failed:', error);
    }
  }, []);
  
  // Smart phone formatting
  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      const formatted = !match[2] ? match[1] : `(${match[1]}) ${match[2]}${match[3] ? `-${match[3]}` : ''}`;
      setPhone(formatted);
    }
  };
  
  // Smart email -> website suggestion
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value.includes('@') && !website) {
      const domain = value.split('@')[1];
      if (domain && domain.includes('.')) {
        setWebsite(`https://${domain}`);
      }
    }
  };
  
  // Smart ZIP -> city/state autofill
  const handleZipChange = async (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    setZip(cleaned.slice(0, 5));
    
    if (cleaned.length === 5) {
      try {
        const response = await fetch(`https://api.zippopotam.us/us/${cleaned}`);
        if (response.ok) {
          const data = await response.json();
          if (data.places && data.places[0]) {
            setCity(data.places[0]['place name']);
            setState(data.places[0]['state abbreviation']);
          }
        }
      } catch (error) {
        // Silent fail - user can still enter manually
        console.log('ZIP lookup failed:', error);
      }
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column - Form */}
        <div className="flex-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-8">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Company Profile</h1>
              <p className="text-gray-600 mt-2">Tell us about your business</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-blue-600">Step 2 of 11</div>
              <div className="text-xs text-slate-500 mt-1">18% Complete</div>
              {saveStatus === 'saved' && (
                <div className="text-xs text-green-600 mt-2 flex items-center justify-end gap-1 transition-opacity duration-300">
                  <span>✔</span>
                  <span className="font-medium">Saved</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: '18%' }}
              />
            </div>
          </div>
        </div>
        
        {/* Basic Information Section */}
        <div className="mb-8 pb-8 border-b border-slate-200">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-2">🏢</span>
            <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Company Name *</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Your Company LLC"
              />
              <p className="mt-1.5 text-xs text-slate-500">This name will appear on all client-facing documents.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="(555) 123-4567"
              />
              <p className="mt-1.5 text-xs text-slate-500">Used for SMS notifications and job updates.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="contact@company.com"
              />
              <p className="mt-1.5 text-xs text-slate-500">This will receive estimate approvals and payment alerts.</p>
            </div>
          </div>
        </div>
        
        {/* Business Details Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <span className="text-2xl mr-2">📍</span>
              <h2 className="text-lg font-semibold text-slate-900">Business Details</h2>
            </div>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Optional — can be completed later</span>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Business Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="123 Main Street"
              />
              <p className="mt-1.5 text-xs text-slate-500">Your primary business location for estimates and invoices.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="CA"
                  maxLength={2}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">ZIP Code</label>
              <input
                type="text"
                value={zip}
                onChange={(e) => handleZipChange(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="90210"
                maxLength={5}
              />
              <p className="mt-1.5 text-xs text-slate-500">Used for local service area calculations.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">License Number</label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Contractor license number"
              />
              <p className="mt-1.5 text-xs text-slate-500">Displayed on estimates to build customer trust and meet compliance.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">EIN <span className="text-xs text-slate-500">(optional)</span></label>
              <input
                type="text"
                value={ein}
                onChange={(e) => setEin(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="12-3456789"
              />
              <p className="mt-1.5 text-xs text-slate-500">For tax documentation and business credibility.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="https://yourcompany.com"
              />
              <p className="mt-1.5 text-xs text-slate-500">Your online presence for customers to learn more about your services.</p>
            </div>
            
            {/* Founder Mode: Advanced Settings */}
            {isFounder && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-2">⚡</span>
                  <h3 className="text-lg font-semibold text-slate-900">Advanced Settings</h3>
                  <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">Founder Mode</span>
                </div>
                
                <div className="space-y-4">
                  {/* Multi-Location Toggle */}
                  <div className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-purple-300 transition-colors">
                    <div className="flex-1 pr-4">
                      <label className="block text-sm font-medium text-slate-900 mb-1 cursor-pointer" htmlFor="multiLocation">
                        Enable Multi-Location Support
                      </label>
                      <p className="text-xs text-slate-600">
                        Manage multiple branches and service territories from one workspace. Adds location selector to estimates and job tracking.
                      </p>
                    </div>
                    <button
                      type="button"
                      id="multiLocation"
                      onClick={() => setMultiLocationEnabled(!multiLocationEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 flex-shrink-0 ${
                        multiLocationEnabled ? 'bg-purple-600' : 'bg-slate-300'
                      }`}
                      role="switch"
                      aria-checked={multiLocationEnabled}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          multiLocationEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  {/* Enterprise Config Toggle */}
                  <div className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-purple-300 transition-colors">
                    <div className="flex-1 pr-4">
                      <label className="block text-sm font-medium text-slate-900 mb-1 cursor-pointer" htmlFor="enterpriseConfig">
                        Enable Enterprise Configuration
                      </label>
                      <p className="text-xs text-slate-600">
                        Unlock advanced workflow customization, custom roles & permissions, API access, and white-label options.
                      </p>
                    </div>
                    <button
                      type="button"
                      id="enterpriseConfig"
                      onClick={() => setEnterpriseConfigEnabled(!enterpriseConfigEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 flex-shrink-0 ${
                        enterpriseConfigEnabled ? 'bg-purple-600' : 'bg-slate-300'
                      }`}
                      role="switch"
                      aria-checked={enterpriseConfigEnabled}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          enterpriseConfigEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                
                <p className="mt-3 text-xs text-slate-500 italic">
                  💡 These features are only visible to workspace founders and won't appear for team members.
                </p>
              </div>
            )}
          </div>
        </div>
          </div>
        </div>
        
        {/* Right Column - Live Preview Panel */}
        <div className="lg:w-96 flex-shrink-0">
          <div className="sticky top-8">
            <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl border border-blue-200 p-6 shadow-lg">
              <div className="mb-4">
                <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Live Preview</div>
                <p className="text-sm text-slate-600">This will appear on your estimates and invoices.</p>
              </div>
              
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                <div className="space-y-3">
                  <div>
                    <div className="font-bold text-lg text-slate-900">
                      {companyName || "Your Company Name"}
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-sm text-slate-600">
                    <div className="flex items-center">
                      <span className="mr-2">📞</span>
                      <span>{phone || "(555) 123-4567"}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">✉️</span>
                      <span>{email || "contact@company.com"}</span>
                    </div>
                    {website && (
                      <div className="flex items-center">
                        <span className="mr-2">🌐</span>
                        <span className="text-blue-600 truncate">{website}</span>
                      </div>
                    )}
                    {address && (
                      <div className="flex items-start mt-2 pt-2 border-t border-slate-100">
                        <span className="mr-2">📍</span>
                        <div className="text-slate-600">
                          <div>{address}</div>
                          {(city || state || zip) && (
                            <div>
                              {city}{city && (state || zip) ? ', ' : ''}{state} {zip}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {licenseNumber && (
                      <div className="flex items-center mt-2 pt-2 border-t border-slate-100">
                        <span className="mr-2">🔖</span>
                        <span className="text-xs">License: {licenseNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
