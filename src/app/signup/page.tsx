"use client";

"use client";
// Simple SettingsIcon component (replace with your actual SettingsIcon if needed)
function SettingsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" width="1em" height="1em" {...props}>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="M10 6v2m0 4v2m4-4h-2m-4 0H6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
// Simple XIcon component (replace with your actual XIcon if needed)
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="1em" height="1em" {...props}>
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Example Icon component (replace with your actual Icon import if needed)
function Icon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
      <path
        d="M6 10l2 2 4-4"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validateEmail(email: string) {
    return /.+@.+\..+/.test(email);
  }

  function validatePassword(password: string) {
    return password.length >= 6;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!validateEmail(email)) {
      setErr("Please enter a valid email address.");
      return;
    }
    if (!validatePassword(password)) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    if (!companyName.trim()) {
      setErr("Company name is required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, companyName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      // Signup succeeded, you may show a message or redirect
      // Redirect to onboarding/Golden Path if provided
      if (data.onboardingPath) {
        setTimeout(() => router.push(data.onboardingPath), 1500);
      } else {
        setTimeout(() => router.push("/app"), 1500);
      }
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "message" in (error as Record<string, unknown>)
      ) {
        setErr((error as { message?: string }).message || "Signup failed");
      } else {
        setErr("Signup failed");
      }
    } finally {
      setLoading(false);
    }
  }

  const isFormValid =
    validateEmail(email) && validatePassword(password) && companyName.trim();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center noselect"
    >
      <div
        className="absolute inset-0 bg-overlay/40"
        style={{ backdropFilter: "blur(12px)" }}
      />
      <div className="relative w-full max-w-lg rounded-2xl bg-background text-slate-900 p-6 shadow-lg fadeMask">
        <div className="absolute top-4 right-4">
          <button
            type="button"
            aria-label="Close dialog"
            className="rounded-xl border p-2"
            onClick={() => router.push("/login")}
          >
            <XIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="absolute top-4 right-20">
          <a
            href="/settings/billing"
            aria-label="Open billing settings"
            className="p-2"
          >
            <SettingsIcon className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
        <div className="absolute top-4 left-4 flex gap-2">
          <button
            className="p-2 rounded-full border"
            aria-label="Open main menu"
          >
            <Icon />
          </button>
          <a href="/x" className="p-2 rounded-full border" aria-label="Close">
            <Icon />
          </a>
        </div>
        <h2 id="modal-title" className="text-2xl font-bold mb-2 text-slate-900">
          Create your Flooring OS account
        </h2>
        <p id="modal-desc" className="mb-6 text-sm text-slate-700">
          Sign up to unlock more features and get started with your workspace.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900">
              Email
            </label>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-slate-400 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900">
              Password
            </label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-400 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="new-password"
            />
          </div>
          <div className="text-xs text-slate-700 mt-1">
            Minimum 6 characters
          </div>

          {err && <p className="text-sm text-red-600 mt-3">{err}</p>}

          <div>
            <label className="block text-sm font-semibold text-slate-900">
              Company name
            </label>
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-slate-400 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={loading}
              autoComplete="organization"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-700 hover:bg-blue-800 py-2 text-white font-semibold transition-colors duration-150 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
            disabled={loading || !isFormValid}
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-slate-700">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-blue-700 underline hover:text-blue-900"
          >
            Sign in
          </a>
        </div>
        <button
          type="button"
          aria-label="Close dialog"
          className="mt-6 rounded-xl border border-slate-400 px-4 py-2 w-full text-slate-900 hover:bg-slate-100"
          onClick={() => router.push("/login")}
        >
          Close
        </button>
      </div>
    </div>
  );
}
