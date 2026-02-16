"use client";

import {
  GoogleAuthProvider
} from "firebase/auth";
import Link from "next/link";
import React, { useState } from "react";
import AuthLayout from "./AuthLayout";
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function LoginPage() {
  const [tab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false); // login loading
  const [err, setErr] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false); // signup loading
  const [signupErr, setSignupErr] = useState('');
  const [signupSuccess] = useState(false);

  const isFormValid = email && password;

  const passwordStrength = (pwd: string): string => {
    if (pwd.length < 6) return 'Weak';
    if (pwd.length < 10 || !/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) return 'Medium';
    return 'Strong';
  };

  // Helper to disable all inputs during loading
  const isAnyLoading = loading || signupLoading;

  const handleGoogleSignIn = async () => {
    if (tab === 'login') setLoading(true);
    else setSignupLoading(true);
    try {
      new GoogleAuthProvider();
      // Add your Google sign-in logic here
    } catch {
      if (tab === 'login') setErr('Failed to sign in with Google');
      else setSignupErr('Failed to sign in with Google');
    } finally {
      if (tab === 'login') setLoading(false);
      else setSignupLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      setErr('Please enter your email');
      return;
    }
    try {
      // Add your password reset logic here
      setResetMsg('Password reset email sent');
    } catch {
      setErr('Failed to send reset email');
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      // 1. Login with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // 2. Fetch user profile from Firestore
      const userDoc = await getDoc(doc(db, `users/${user.uid}`));
      const userData = userDoc.exists() ? userDoc.data() : null;
      // 3. Founder detection and routing
      if (userData?.isFounder) {
        routeTo("/founder/dashboard");
      } else {
        // TODO: fetch workspaces, for now just route to onboarding
        routeTo("/onboarding");
      }
      // 4. Update lastLoginAt
      await setDoc(doc(db, `users/${user.uid}`), { lastLoginAt: serverTimestamp() }, { merge: true });
    } catch (err: unknown) {
      if (typeof err === "object" && err && "message" in err) {
        setErr((err as { message?: string }).message || "Login failed");
      } else {
        setErr("Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupLoading(true);
    setSignupErr("");
    try {
      // 1. Create user with email & password (Firebase Auth)
      const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      const user = userCredential.user;
      // 2. Store user profile in Firestore
      await setDoc(doc(db, `users/${user.uid}`), {
        email: signupEmail,
        fullName,
        isFounder: true, // TODO: founder logic
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
      // 3. Route to onboarding
      routeTo("/onboarding");
    } catch (err: unknown) {
      if (typeof err === "object" && err && "message" in err) {
        setSignupErr((err as { message?: string }).message || "Signup failed");
      } else {
        setSignupErr("Signup failed");
      }
    } finally {
      setSignupLoading(false);
    }
  };

  // Helper: route user (replace with Next.js router if available)
  const routeTo = (path: string) => {
    window.location.href = path;
  };

  return (
    <AuthLayout>
      <div className="space-y-4">
        {/* Auth Form */}
        {tab === 'login' ? (
          <form onSubmit={onSubmit} className="space-y-4" autoComplete="on">
            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isAnyLoading}
              className="w-full flex items-center justify-center gap-3 rounded-lg border border-green-300 bg-white py-2 px-4 text-green-700 font-semibold hover:bg-green-50 disabled:opacity-50 mb-4"
            >
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" style={{ display: loading ? 'inline' : 'none' }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              {loading ? "Signing in..." : "Continue with Google"}
            </button>
            {/* Divider */}
            <div className="flex items-center mb-2">
              <div className="flex-1 border-t border-green-200"></div>
              <span className="px-4 text-sm text-green-500">or</span>
              <div className="flex-1 border-t border-green-200"></div>
            </div>
            {/* Email/Password fields */}
            <div>
              <label className="block text-green-700 mb-2">Email</label>
              <input
                type="email"
                className="w-full border border-green-300 rounded px-3 py-2"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                disabled={isAnyLoading}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-green-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full border border-green-300 rounded px-3 py-2 pr-10"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={isAnyLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-green-600 text-xs"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isAnyLoading}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center text-xs text-green-700">
                <input
                  type="checkbox"
                  className="mr-2 accent-green-500"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  disabled={isAnyLoading}
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-green-600 hover:underline"
                disabled={isAnyLoading}
              >
                Forgot password?
              </button>
            </div>
            {err && (
              <p className="text-sm text-red-500 mt-3 transition-opacity duration-300 opacity-0 animate-fade-in" style={{animation: 'fadeIn 0.3s forwards'}}>{err}</p>
            )}
            {resetMsg && (
              <p className="text-sm text-green-600 mt-3 transition-opacity duration-300 opacity-0 animate-fade-in" style={{animation: 'fadeIn 0.3s forwards'}}>{resetMsg}</p>
            )}
            <button
              type="submit"
              disabled={isAnyLoading || !isFormValid}
              className="w-full rounded-lg bg-green-500 py-2 text-white font-semibold disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                  Signing in…
                </>
              ) : "Sign in"}
            </button>
            <div className="text-xs text-green-700 text-center mt-2 opacity-80">
              {tab === 'login'
                ? 'Secure checkout later — you can set up first'
                : 'No credit card required to start'}
            </div>
          </form>
        ) : (
          <form onSubmit={onSignup} className="space-y-4" autoComplete="on">
            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isAnyLoading}
              className="w-full flex items-center justify-center gap-3 rounded-lg border border-green-300 bg-white py-2 px-4 text-green-700 font-semibold hover:bg-green-50 disabled:opacity-50 mb-4"
            >
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" style={{ display: signupLoading ? 'inline' : 'none' }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              {signupLoading ? "Signing in..." : "Continue with Google"}
            </button>
            {/* Divider */}
            <div className="flex items-center mb-2">
              <div className="flex-1 border-t border-green-200"></div>
              <span className="px-4 text-sm text-green-500">or</span>
              <div className="flex-1 border-t border-green-200"></div>
            </div>
            {/* Signup fields */}
            <div>
              <label className="block text-green-700 mb-2">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full border border-green-300 rounded px-3 py-2"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  disabled={isAnyLoading}
                  autoComplete="name"
                />
              </div>
            </div>
            <div>
              <label className="block text-green-700 mb-2">Email</label>
              <input
                type="email"
                className="w-full border border-green-300 rounded px-3 py-2"
                value={signupEmail}
                onChange={e => setSignupEmail(e.target.value)}
                required
                disabled={isAnyLoading}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-green-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full border border-green-300 rounded px-3 py-2 pr-10"
                  value={signupPassword}
                  onChange={e => setSignupPassword(e.target.value)}
                  required
                  disabled={isAnyLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-green-600 text-xs"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isAnyLoading}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <div className="text-xs mt-1">
                Strength: <span className={
                  passwordStrength(signupPassword) === 'Strong' ? 'text-green-600' :
                  passwordStrength(signupPassword) === 'Medium' ? 'text-yellow-600' : 'text-red-600'}
                >
                  {passwordStrength(signupPassword)}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-green-700 mb-2">Confirm Password</label>
              <input
                type="password"
                className="w-full border border-green-300 rounded px-3 py-2"
                value={signupConfirm}
                onChange={e => setSignupConfirm(e.target.value)}
                required
                disabled={isAnyLoading}
                autoComplete="new-password"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                className="mr-2 accent-green-500"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                disabled={isAnyLoading}
                required
              />
              <span className="text-xs text-green-700">
                I agree to <Link href="/terms" className="underline">Terms</Link> &amp; <Link href="/privacy" className="underline">Privacy</Link>
              </span>
            </div>
            {signupErr && (
              <p className="text-sm text-red-500 mt-3 transition-opacity duration-300 opacity-0 animate-fade-in" style={{animation: 'fadeIn 0.3s forwards'}}>{signupErr}</p>
            )}
            {signupSuccess && (
              <p className="text-sm text-green-600 mt-3 transition-opacity duration-300 opacity-0 animate-fade-in" style={{animation: 'fadeIn 0.3s forwards'}}>Account created ✅</p>
            )}
            <button
              type="submit"
              disabled={isAnyLoading}
              className="w-full rounded-lg bg-green-500 py-2 text-white font-semibold disabled:opacity-50 flex items-center justify-center"
            >
              {signupLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                  Creating your account…
                </>
              ) : "Create account"}
            </button>
            {/* Message handled above for both forms */}
          </form>
        )}
        {/* Divider */}
        <div className="mt-4 flex items-center">
          <div className="flex-1 border-t border-green-200"></div>
          <span className="px-4 text-sm text-green-500">or</span>
          <div className="flex-1 border-t border-green-200"></div>
        </div>
        {/* Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="mt-4 w-full flex items-center justify-center gap-3 rounded-lg border border-green-300 bg-white py-2 px-4 text-green-700 font-semibold hover:bg-green-50 disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {loading ? "Signing in..." : "Continue with Google"}
        </button>
        {/* Links */}
        <div className="mt-6 flex flex-col items-center text-xs text-green-700 gap-2">
          <div>
            <Link href="/terms" className="underline">Terms</Link> &nbsp;|&nbsp;
            <Link href="/privacy" className="underline">Privacy</Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
