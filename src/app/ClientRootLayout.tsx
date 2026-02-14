"use client";

import { FeaturesProvider } from "@/lib/deviceDetectionProvider";
import { auth, db } from "@/lib/firebase";
import type { UserSubscription } from "@/lib/pricingTiers";
import { loadUserSubscription } from "@/lib/subscriptionManager";
import { TierProvider } from "@/lib/useTier";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

interface ClientRootLayoutProps {
  children: React.ReactNode;
}

interface AuthUser {
  uid: string;
  email: string | null;
  workspaceId?: string;
}

export function ClientRootLayout({ children }: ClientRootLayoutProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/test-login', '/'];

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        // Only redirect to login if we're not already on a public route
        if (!publicRoutes.some(route => pathname?.startsWith(route))) {
          router.push("/login");
        }
        setLoading(false);
        return;
      }
      // Unified workspace logic for all users
      let workspaceId: string | undefined = undefined;
      const wsRef = doc(db, "workspaces", firebaseUser.uid);
      let wsSnap = await getDoc(wsRef);
      if (!wsSnap.exists()) {
        // Create a workspace for this user if it doesn't exist
        await setDoc(wsRef, {
          userId: firebaseUser.uid,
          email: firebaseUser.email,
          createdAt: Date.now(),
          plan: { key: "essentials" },
          status: "active",
          members: [firebaseUser.email],
        });
        wsSnap = await getDoc(wsRef);
      }
      workspaceId = firebaseUser.uid;
      if (typeof window !== "undefined") {
        const wsData = wsSnap.data() || {};
        const wsObj = {
          id: workspaceId,
          name: wsData.name || "My Workspace",
          plan: wsData.plan || { key: "essentials" },
          ...wsData,
        };
        localStorage.setItem("workspace", JSON.stringify(wsObj));
      }
      // Onboarding check: redirect to /onboarding if not complete
      try {
        const onboardingRef = doc(
          db,
          "workspaces",
          firebaseUser.uid,
          "onboarding",
          "state",
        );
        const onboardingSnap = await getDoc(onboardingRef);
        let onboardingComplete = false;
        if (onboardingSnap.exists()) {
          const onboardingData = onboardingSnap.data();
          onboardingComplete =
            onboardingData.status === "complete" ||
            Boolean(onboardingData.complete);
        }
        if (!onboardingComplete) {
          router.push("/onboarding");
          return;
        }
      } catch (err) {
        // If onboarding check fails, send to onboarding as fallback
        router.push("/onboarding");
        return;
      }
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        workspaceId,
      });
    });
    return () => unsubscribe();
  }, [router, pathname]);

  // Load subscription when user changes
  useEffect(() => {
    async function loadSubscription() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const userSubscription = await loadUserSubscription(
          user.uid,
          user.email || "",
        );
        if (userSubscription) {
          setSubscription(userSubscription);
        } else {
          setSubscription({
            userId: user.uid,
            workspaceId: user.workspaceId || "unknown",
            tier: "essentials",
            billingCycle: "monthly",
            monthlyAmount: 299,
            nextBillingDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
            currentUserCount: 1,
            seatLimit: 5,
            activeAddOns: [],
            status: "trialing",
            trialEndsAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            autoRenew: true,
          });
        }
      } catch (error) {
        console.error("Error loading subscription:", error);
        setSubscription({
          userId: user.uid,
          workspaceId: user.workspaceId || "unknown",
          tier: "essentials",
          billingCycle: "monthly",
          monthlyAmount: 299,
          nextBillingDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
          currentUserCount: 1,
          seatLimit: 5,
          activeAddOns: [],
          status: "trialing",
          trialEndsAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          autoRenew: true,
        });
      } finally {
        setLoading(false);
      }
    }
    loadSubscription();
  }, [user]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // If not authenticated but on a public route, render children anyway
  if (!user && publicRoutes.some(route => pathname?.startsWith(route))) {
    return <>{children}</>;
  }

  // If not authenticated and not on a public route, show nothing (will redirect)
  if (!user) {
    return null;
  }

  return (
    <TierProvider subscription={subscription}>
      <FeaturesProvider>{children}</FeaturesProvider>
    </TierProvider>
  );
}
