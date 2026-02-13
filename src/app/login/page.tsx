"use client";

import { auth } from "@/lib/firebase";
import {
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
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
