"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";
import Image from "next/image";
import { auth } from "@/lib/firebase";

export default function WorkspaceSetupPage() {
  const router = useRouter();
  // Form state
  const [workspaceName, setWorkspaceName] = useState("");
  const [businessType, setBusinessType] = useState("Flooring Contractor");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Helper: get initials from workspace name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");

  // Phone input mask helper
  const formatPhone = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");
    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const [commission, setCommission] = useState(10);
  const [markup, setMarkup] = useState(35);
  const [minMargin, setMinMargin] = useState(25);

  const [isFounder] = useState(true); // TODO: Replace with real founder detection
  const [showFounder, setShowFounder] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [maxDiscount, setMaxDiscount] = useState(0);
  const [allowOverride, setAllowOverride] = useState(false);
  const [testViolation, setTestViolation] = useState(false);

  // Update handleContinue to save founder policy settings
  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      if (!isCompanyNameValid) {
        setError("Company name must be at least 2 characters.");
        setSaving(false);
        return;
      }
      if (!isPhoneValid) {
        setError("Phone number must be 10 digits.");
        setSaving(false);
        return;
      }
      if (!user) {
        setError("User not authenticated.");
        setSaving(false);
        return;
      }
      // 1. Write workspace doc
      const workspaceData: Record<string, unknown> = {
        ownerId: user.uid,
        name: workspaceName,
        industry: businessType,
        contact: {
          phone: businessPhone,
          email: businessEmail,
          address: businessAddress,
        },
        operationalDefaults: {
          commission,
          markup,
          minMargin,
        },
        onboardingStep: "service_area",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (isFounder) {
        workspaceData.policySettings = {
          requireApproval,
          maxDiscount,
          allowOverride,
          testViolation,
        };
      }
      await setDoc(doc(db, `workspaces/${workspaceId}`), workspaceData, { merge: true });
      // 2. Create membership record
      await setDoc(doc(db, `workspaces/${workspaceId}/members/${user.uid}`), {
        role: isFounder ? "founder" : "owner",
        permissions: "full",
        createdAt: serverTimestamp(),
      }, { merge: true });
      // 3. Update user defaultWorkspaceId
      await setDoc(doc(db, `users/${user.uid}`), {
        defaultWorkspaceId: workspaceId,
      }, { merge: true });
      setSuccess(true);
      router.push("/onboarding/service-area");
    } catch (err) {
      setError((err as { message?: string }).message || "Failed to save workspace");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const storageRef = ref(storage, `workspace-logos/${workspaceId}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setLogoUrl(url);
      // Save logo URL to Firestore
      await setDoc(doc(db, `workspaces/${workspaceId}`), { logoUrl: url }, { merge: true });
    } catch (err) {
      setError((err as { message?: string }).message || "Failed to upload logo");
    } finally {
      setLogoUploading(false);
    }
  };

  // Progress bar step
  const step = 1;
  const totalSteps = 6;

  // Example workspaceId (replace with real logic)
  const workspaceId = "demo-workspace-id";

  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (u && !businessEmail) setBusinessEmail(u.email || "");
    });
    return () => unsubscribe();
  }, [businessEmail]);

  // Validation helpers
  const isCompanyNameValid = workspaceName.length >= 2;
  const isPhoneValid = businessPhone.replace(/\D/g, "").length === 10;
  const canContinue = isCompanyNameValid && isPhoneValid && !saving;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top Section */}
      <div className="w-full max-w-2xl mx-auto pt-10 pb-4 px-4">
        <div className="flex items-center gap-4 mb-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-400 transition-all duration-500"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 font-semibold whitespace-nowrap">
            Step {step} of {totalSteps}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-green-900 mb-1">Set up your workspace</h1>
        <p className="text-green-700 text-sm mb-2">
          Tell us about your workspace to get started.
        </p>
      </div>

      {/* Main Section */}
      <div className="flex-1 flex flex-col md:flex-row gap-8 w-full max-w-4xl mx-auto px-4">
        {/* Workspace Form Card */}
        <div className="bg-white rounded-2xl shadow p-6 flex-1 max-w-md border border-gray-100 mx-auto md:mx-0">
          <form className="space-y-8" onSubmit={handleContinue}>
            {/* SECTION A — Business Identity */}
            <div>
              <h2 className="text-green-900 font-semibold text-lg mb-4">Business Identity</h2>
              <div className="mb-4">
                <label className="block text-green-700 mb-2 font-medium">Company Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-2xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all duration-200 bg-white/80"
                  value={workspaceName}
                  onChange={e => setWorkspaceName(e.target.value)}
                  placeholder="Williams Flooring"
                  minLength={2}
                  required
                />
                {workspaceName.length > 0 && workspaceName.length < 2 && (
                  <p className="text-xs text-red-500 mt-1">Company name must be at least 2 characters.</p>
                )}
              </div>
              {/* Business Type Dropdown */}
              <div className="mb-4">
                <label className="block text-green-700 mb-2 font-medium">Business Type <span className="text-red-500">*</span></label>
                <select
                  className="w-full border border-gray-200 rounded-2xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all duration-200 bg-white/80"
                  value={businessType}
                  onChange={e => setBusinessType(e.target.value)}
                  required
                >
                  <option value="Flooring Contractor">Flooring Contractor</option>
                  <option value="General Contractor">General Contractor</option>
                  <option value="Remodeling">Remodeling</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            {/* SECTION B — Contact Info */}
            <div className="mb-8">
              <h2 className="text-green-900 font-semibold text-lg mb-4">Contact Info</h2>
              {/* Business Phone */}
              <div className="mb-4">
                <label className="block text-green-700 mb-2 font-medium">Primary Business Phone</label>
                <input
                  type="tel"
                  className="w-full border border-gray-200 rounded-2xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all duration-200 bg-white/80"
                  value={formatPhone(businessPhone)}
                  onChange={e => setBusinessPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  maxLength={14}
                />
              </div>
              {/* Business Email */}
              <div className="mb-4">
                <label className="block text-green-700 mb-2 font-medium">Business Email</label>
                <input
                  type="email"
                  className="w-full border border-gray-200 rounded-2xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all duration-200 bg-white/80"
                  value={businessEmail}
                  onChange={e => setBusinessEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </div>
              {/* Business Address (Optional) */}
              <div className="mb-4">
                <label className="block text-green-700 mb-2 font-medium">Business Address <span className="text-green-400">(Optional)</span></label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-2xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all duration-200 bg-white/80"
                  value={businessAddress}
                  onChange={e => setBusinessAddress(e.target.value)}
                  placeholder="123 Main St, Springfield, IL"
                />
              </div>
            </div>
            {/* SECTION C — Operational Defaults */}
            <div className="mb-8">
              <h2 className="text-green-900 font-semibold text-lg mb-4">Operational Defaults</h2>
              <p className="text-green-700 text-sm mb-4">These settings protect your profitability.</p>
              {/* Default Commission % */}
              <div className="mb-4">
                <label className="block text-green-700 mb-2 font-medium">Default Commission %</label>
                <input
                  type="number"
                  className="w-full border border-gray-200 rounded-2xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all duration-200 bg-white/80"
                  value={commission}
                  onChange={e => setCommission(Number(e.target.value))}
                  min={0}
                  max={100}
                  step={0.1}
                  required
                />
              </div>
              {/* Default Markup % */}
              <div className="mb-4">
                <label className="block text-green-700 mb-2 font-medium">Default Markup %</label>
                <input
                  type="number"
                  className="w-full border border-green-300 rounded px-3 py-2"
                  value={markup}
                  onChange={e => setMarkup(Number(e.target.value))}
                  min={0}
                  max={100}
                  step={0.1}
                  required
                />
              </div>
              {/* Minimum Allowed Margin % */}
              <div className="mb-4">
                <label className="block text-green-700 mb-2 font-medium">Minimum Allowed Margin %</label>
                <input
                  type="number"
                  className="w-full border border-green-300 rounded px-3 py-2"
                  value={minMargin}
                  onChange={e => setMinMargin(Number(e.target.value))}
                  min={0}
                  max={100}
                  step={0.1}
                  required
                />
              </div>
            </div>
            {/* Logo Upload */}
            <div className="mb-6">
              <label className="block text-green-700 mb-2 font-medium">Logo (Optional)</label>
              <div
                className="flex items-center gap-4"
              >
                {/* Circular preview */}
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-2xl font-bold text-green-700 overflow-hidden border border-green-300">
                  {logoUrl ? (
                    <Image src={logoUrl} alt="Logo preview" width={64} height={64} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span>{getInitials(workspaceName)}</span>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={logoInputRef}
                    onChange={handleLogoChange}
                  />
                  <button
                    type="button"
                    className="px-4 py-2 bg-green-500 text-white rounded-2xl font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all duration-200"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={logoUploading}
                  >
                    {logoUploading ? "Uploading..." : "Upload Logo"}
                  </button>
                  <div className="text-xs text-green-700 mt-1">Drag & drop coming soon</div>
                </div>
              </div>
            </div>
            {/* SECTION D — Founder Controls (Hidden from Users) */}
            {isFounder && (
              <div className="mb-8">
                <button
                  type="button"
                  className="flex items-center gap-2 text-green-900 font-semibold text-lg mb-2 focus:outline-none"
                  onClick={() => setShowFounder(v => !v)}
                  aria-expanded={showFounder}
                  aria-controls="founder-controls-section"
                >
                  <span role="img" aria-label="lock">🔐</span> Founder Controls
                  <span className="ml-2">{showFounder ? "▲" : "▼"}</span>
                </button>
                {showFounder && (
                  <div id="founder-controls-section" className="bg-green-50 border border-green-200 rounded-xl p-4 mt-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-green-700 font-medium">Require approval under X% margin</label>
                      <input
                        type="checkbox"
                        checked={requireApproval}
                        onChange={e => setRequireApproval(e.target.checked)}
                        className="accent-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-green-700 mb-2 font-medium">Maximum discount allowed %</label>
                      <input
                        type="number"
                        className="w-full border border-gray-200 rounded-2xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all duration-200 bg-white/80"
                        value={maxDiscount}
                        onChange={e => setMaxDiscount(Number(e.target.value))}
                        min={0}
                        max={100}
                        step={0.1}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-green-700 font-medium">Allow margin override</label>
                      <input
                        type="checkbox"
                        checked={allowOverride}
                        onChange={e => setAllowOverride(e.target.checked)}
                        className="accent-green-500"
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-2xl font-semibold hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all duration-200"
                        onClick={() => setTestViolation(true)}
                      >
                        Simulate policy violation (test mode)
                      </button>
                      {testViolation && (
                        <span className="ml-2 text-xs text-red-500">Policy violation simulated!</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
        {/* Live Preview Panel (mobile below form, desktop right) */}
        <div className="block md:hidden mt-8">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex flex-col items-center justify-center">
            <span className="text-green-900 font-bold text-lg mb-4">Your Workspace Preview</span>
            {/* Logo preview */}
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-3xl font-bold text-green-700 overflow-hidden border border-green-300 mb-3">
              {logoUrl ? (
                <Image src={logoUrl} alt="Logo preview" width={80} height={80} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span>{getInitials(workspaceName)}</span>
              )}
            </div>
            {/* Company name */}
            <div className="text-xl text-green-900 font-bold mb-2">
              {workspaceName || "Your workspace name will appear here"}
            </div>
            {/* Sample estimate header */}
            <div className="w-full bg-white border border-green-200 rounded-lg p-4 mb-2 text-center shadow-sm">
              <span className="text-green-700 font-semibold">Sample Estimate</span>
              <div className="text-xs text-green-500 mt-1">Williams Flooring • Estimate #12345</div>
            </div>
            {/* Protected by margin policy badge */}
            {isFounder && requireApproval && (
              <div className="flex items-center gap-2 bg-green-200 text-green-900 px-3 py-1 rounded-full text-xs font-semibold mt-2">
                <span role="img" aria-label="shield">🛡️</span> Protected by margin policy
              </div>
            )}
          </div>
        </div>
        <div className="hidden md:block flex-1">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 h-full flex flex-col items-center justify-center">
            <span className="text-green-900 font-bold text-lg mb-4">Your Workspace Preview</span>
            {/* Logo preview */}
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-3xl font-bold text-green-700 overflow-hidden border border-green-300 mb-3">
              {logoUrl ? (
                <Image src={logoUrl} alt="Logo preview" width={80} height={80} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span>{getInitials(workspaceName)}</span>
              )}
            </div>
            {/* Company name */}
            <div className="text-xl text-green-900 font-bold mb-2">
              {workspaceName || "Your workspace name will appear here"}
            </div>
            {/* Sample estimate header */}
            <div className="w-full bg-white border border-green-200 rounded-lg p-4 mb-2 text-center shadow-sm">
              <span className="text-green-700 font-semibold">Sample Estimate</span>
              <div className="text-xs text-green-500 mt-1">Williams Flooring • Estimate #12345</div>
            </div>
            {/* Protected by margin policy badge */}
            {isFounder && requireApproval && (
              <div className="flex items-center gap-2 bg-green-200 text-green-900 px-3 py-1 rounded-full text-xs font-semibold mt-2">
                <span role="img" aria-label="shield">🛡️</span> Protected by margin policy
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: sticky on mobile */}
      <div className="w-full max-w-2xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 pb-8 md:py-8 md:static fixed bottom-0 left-0 right-0 bg-white/90 z-20 border-t border-gray-100 md:border-0">
        <button
          className="text-green-700 text-sm underline hidden md:block"
          // onClick={handleBack}
        >
          Back
        </button>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            className="bg-green-500 text-white font-semibold rounded-2xl px-6 py-2 shadow disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all duration-200 w-full md:w-auto"
            type="submit"
            disabled={!canContinue}
          >
            {saving ? "Saving..." : "Continue"}
          </button>
          <button
            className="text-green-700 text-sm border border-gray-200 rounded-2xl px-4 py-2 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all duration-200 w-full md:w-auto"
            // onClick={handleSaveExit}
          >
            Save & Exit
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      {success && <p className="text-xs text-green-600 mt-2">Workspace saved!</p>}
    </div>
  );
}
