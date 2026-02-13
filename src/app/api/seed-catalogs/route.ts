import { getApps, initializeApp } from "firebase/app";
import { collection, doc, getFirestore, setDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

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

import { withWorkspace } from "@/lib/withWorkspace";

const DEMO_WORKSPACE_ID = process.env.SEED_WORKSPACE_ID;
if (!DEMO_WORKSPACE_ID)
  throw new Error("SEED_WORKSPACE_ID must be set in environment");

async function seedDemoCatalog() {
  const items = [
    {
      id: "demo_carpet",
      name: "Demo carpet",
      unitType: "sqft",
      costPrice: 1.5,
      sellPrice: 3.0,
      notes: "Standard demo carpet",
    },
    {
      id: "demo_tile",
      name: "Demo tile",
      unitType: "sqft",
      costPrice: 2.0,
      sellPrice: 4.0,
      notes: "Standard demo tile",
    },
    {
      id: "demo_glued_down_wood",
      name: "Demo glued-down wood",
      unitType: "sqft",
      costPrice: 3.0,
      sellPrice: 6.0,
      notes: "Glued-down wood flooring",
    },
    {
      id: "demo_floating_floor",
      name: "Demo floating floor",
      unitType: "sqft",
      costPrice: 2.5,
      sellPrice: 5.0,
      notes: "Floating floor demo",
    },
    {
      id: "haul_away",
      name: "Haul-away",
      unitType: "flat_fee",
      costPrice: 50.0,
      sellPrice: 100.0,
      notes: "Haul-away service",
    },
  ];
  for (const item of items) {
    await setDoc(doc(collection(db, "demo_catalog"), item.id), {
      ...withWorkspace(DEMO_WORKSPACE_ID!, item),
    });
  }
}

async function seedAccessoriesCatalog() {
  const items = [
    {
      id: "underlayment",
      name: "Underlayment",
      unitType: "sqft",
      costPrice: 0.25,
      sellPrice: 0.5,
      attachRules: "If laminate selected → suggest underlayment",
      notes: "Required for floating floors",
    },
    {
      id: "pad",
      name: "Pad",
      unitType: "sqft",
      costPrice: 0.2,
      sellPrice: 0.4,
      attachRules: "If carpet selected → suggest pad",
      notes: "Carpet pad",
    },
    {
      id: "moisture_barrier",
      name: "Moisture barrier",
      unitType: "sqft",
      costPrice: 0.3,
      sellPrice: 0.6,
      attachRules: "If wood or laminate selected → suggest moisture barrier",
      notes: "Protects against moisture",
    },
    {
      id: "quarter_round",
      name: "Quarter round/base/shoe",
      unitType: "linear_ft",
      costPrice: 0.5,
      sellPrice: 1.0,
      attachRules: "If new floor installed → suggest quarter round",
      notes: "Finishing trim",
    },
    {
      id: "transitions",
      name: "Transitions (T-mold, reducer, end cap, stair nose)",
      unitType: "each",
      costPrice: 5.0,
      sellPrice: 10.0,
      attachRules: "If floor type changes → suggest transition",
      notes: "Transition pieces",
    },
    {
      id: "leveling_compound",
      name: "Leveling compound, patch",
      unitType: "sqft",
      costPrice: 1.0,
      sellPrice: 2.0,
      attachRules: "If subfloor uneven → suggest leveling compound",
      notes: "For subfloor prep",
    },
    {
      id: "adhesive",
      name: "Adhesive",
      unitType: "sqft",
      costPrice: 0.4,
      sellPrice: 0.8,
      attachRules: "If glued-down floor → suggest adhesive",
      notes: "Glue for installation",
    },
    {
      id: "fasteners",
      name: "Fasteners",
      unitType: "each",
      costPrice: 0.1,
      sellPrice: 0.2,
      attachRules: "If nailed floor → suggest fasteners",
      notes: "Nails or screws",
    },
  ];
  for (const item of items) {
    await setDoc(doc(collection(db, "accessories_catalog"), item.id), {
      ...withWorkspace(DEMO_WORKSPACE_ID!, item),
    });
  }
}

export async function POST(req: Request) {
  try {
    await seedDemoCatalog();
    await seedAccessoriesCatalog();
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}
