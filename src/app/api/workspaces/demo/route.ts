import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

// Example workspace data
const workspaceId = "demo-workspace-001";
const workspaceData = {
  name: "Demo Workspace",
  slug: "demo-workspace",
  ownerUserId: "demo-owner-uid",
  timezone: "America/Chicago",
  status: "active",
  branding: {},
  settings: {},
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
};

export async function POST() {
  // Create or overwrite the workspace document
  await setDoc(doc(db, "workspaces", workspaceId), workspaceData);
  return NextResponse.json({ success: true, workspaceId });
}

export async function GET() {
  // Fetch the workspace document
  const ref = doc(db, "workspaces", workspaceId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return NextResponse.json({ exists: false });
  }
  return NextResponse.json({ exists: true, data: snap.data() });
}
