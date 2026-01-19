"use client";

import React, { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { TierProvider } from "@/lib/useTier";
import { FeaturesProvider } from "@/lib/deviceDetectionProvider";
import { loadUserSubscription } from "@/lib/subscriptionManager";
import type { UserSubscription } from "@/lib/pricingTiers";

interface ClientRootLayoutProps {
  children: React.ReactNode;
}

interface AuthUser {
  uid: string;
  email: string | null;
}

export function ClientRootLayout({ children }: ClientRootLayoutProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

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
          user.email || ""
        );

        if (userSubscription) {
          setSubscription(userSubscription);
        } else {
          // Fallback to default Core tier if no subscription found
          setSubscription({
            userId: user.uid,
            workspaceId: "unknown",
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
        // Fallback to default Essentials tier on error
        setSubscription({
          userId: user.uid,
          workspaceId: "unknown",
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

  return (
    <TierProvider subscription={subscription}>
      <FeaturesProvider>{children}</FeaturesProvider>
    </TierProvider>
  );
}
