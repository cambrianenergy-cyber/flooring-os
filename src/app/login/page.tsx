"use client";

import { auth } from "@/lib/firebase";
import {
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
} from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  function validateEmail(email: string) {
    return /.+@.+\..+/.test(email);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!validateEmail(email)) {
      setErr("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setErr("Password is required.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/app");
    } catch (error: unknown) {
      let msg = "Login failed";
      if (
        typeof error === "object" &&
        error &&
        "message" in error &&
        typeof (error as { message?: unknown }).message === "string"
      ) {
        msg = (error as { message: string }).message;
      }
      if (msg.includes("auth/user-not-found"))
        msg = "No user found with this email.";
      if (msg.includes("auth/wrong-password")) msg = "Incorrect password.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  const isFormValid = validateEmail(email) && password.length > 0;

  async function handleGoogleSignIn() {
    setErr(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/app");
    } catch (error: unknown) {
      let msg = "Google sign-in failed";
      if (
        typeof error === "object" &&
        error &&
        "message" in error &&
        typeof (error as { message?: unknown }).message === "string"
      ) {
        msg = (error as { message: string }).message;
      }
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    setErr(null);
    setResetMsg(null);
    if (!validateEmail(email)) {
      setErr("Enter your email to reset password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMsg("Password reset email sent.");
    } catch (e: unknown) {
      let msg = "Failed to send reset email.";
      if (
        typeof e === "object" &&
        e &&
        "message" in e &&
        typeof (e as { message?: unknown }).message === "string"
      ) {
        msg = (e as { message: string }).message;
      }
      setErr(msg);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
      <div className="w-full max-w-md rounded-xl bg-background text-slate-900 p-8 shadow-xl">
        <h1 className="mb-6 text-2xl font-bold">Sign in to Flooring OS</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-accent hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {err && <p className="text-sm text-danger mt-3">{err}</p>}
          {resetMsg && <p className="text-sm text-success mt-3">{resetMsg}</p>}

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full rounded-lg bg-slate-900 py-2 text-background font-semibold disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-4 flex items-center">
          <div className="flex-1 border-t border-slate-300"></div>
          <span className="px-4 text-sm text-slate-500">or</span>
          <div className="flex-1 border-t border-slate-300"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="mt-4 w-full flex items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white py-2 px-4 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

        <div className="mt-4 text-center text-sm text-slate-500">
          Don’t have an account?{" "}
          <Link className="text-slate-900 underline" href="/signup">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
