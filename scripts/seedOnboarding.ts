// seedOnboarding.ts
// Script to seed Firestore onboarding state for a workspace with all onboarding steps

import { getApps, initializeApp } from "firebase/app";
import { doc, getFirestore, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

const workspaceId = process.env.SEED_WORKSPACE_ID;
if (!workspaceId)
  throw new Error("SEED_WORKSPACE_ID must be set in environment");

async function seedOnboarding() {
  const onboardingData = {
    companyName: "Demo Flooring Co.",
    website: "https://demo-flooring.com",
    industry: "Flooring",
    team: [
      { email: "owner@demo.com", role: "Owner" },
      { email: "admin@demo.com", role: "Admin" },
    ],
    serviceArea: { zip: "12345", radius: "50" },
    teamSetup: { members: "Owner, Admin", roles: "Owner, Admin" },
    servicesStep: {
      services: "Carpet, Tile, Wood",
      addons: "Haul-away, Underlayment",
    },
    pricing: { basePrice: "3.00", laborRate: "1.50" },
    leadIntake: { leadSource: "Website", intakeMethod: "Form" },
    estimateWorkflow: { estimateType: "Standard", workflow: "Default" },
    catalog: {
      materials: "Demo carpet, Demo tile",
      vendors: "Vendor A, Vendor B",
    },
    integrations: "QuickBooks, Stripe",
    status: "complete",
    step: "review-finish",
    updatedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  await setDoc(
    doc(db, "workspaces", workspaceId!, "onboarding", "state"),
    onboardingData,
    { merge: true },
  );
  console.log(`Seeded onboarding for workspace: ${workspaceId}`);
}

seedOnboarding().catch(console.error);
