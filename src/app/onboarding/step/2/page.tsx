import React from "react";
"use client";
import { useState } from "react";

export default function OnboardingStep2Page() {
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your Company LLC"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="contact@company.com"
              />
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="123 Main Street"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                onChange={(e) => setZip(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="90210"
                maxLength={10}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">License Number</label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Contractor license number"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">EIN <span className="text-xs text-slate-500">(optional)</span></label>
              <input
                type="text"
                value={ein}
                onChange={(e) => setEin(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="12-3456789"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://yourcompany.com"
              />
            </div>
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
