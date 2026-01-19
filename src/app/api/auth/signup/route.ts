// src/app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { email, password, companyName } = await req.json();
    if (!email || !password || !companyName) {
      return new NextResponse("Missing required fields", { status: 400 });
    }
    // Create user in Firebase Auth
    const admin = await import("firebase-admin");
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: companyName,
    });
    // Create workspace document with default settings and owner role
    const workspaceId = userRecord.uid;
    await adminDb().collection("workspaces").doc(workspaceId).set({
      companyName,
      ownerEmail: email,
      createdAt: new Date(),
      planKey: "foundation", // default plan
      settings: {
        theme: "dark",
        notifications: true,
        // Add more default settings as needed
      },
      members: [
        {
          uid: userRecord.uid,
          email,
          role: "owner",
          joinedAt: new Date(),
        },
      ],
    });
    // Return onboarding/Golden Path route
    return NextResponse.json({
      uid: userRecord.uid,
      email,
      companyName,
      workspaceId,
      onboardingPath: "/app/onboarding" // or your Golden Path route
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
