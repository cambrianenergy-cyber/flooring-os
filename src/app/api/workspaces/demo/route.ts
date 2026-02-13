import { db } from "@/lib/firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

// Helper to extract workspaceId and ownerUserId from request or session
function getWorkspaceContext(req: Request) {
  // Example: extract from headers, cookies, or session (customize as needed)
  const workspaceId =
    req.headers.get("x-workspace-id") || process.env.NEXT_PUBLIC_WORKSPACE_ID;
  const ownerUserId =
    req.headers.get("x-owner-uid") || req.headers.get("x-debug-uid");
  if (!workspaceId || !ownerUserId)
    throw new Error("Missing workspaceId or ownerUserId");
  return { workspaceId, ownerUserId };
}

export async function POST(req: Request) {
  const { workspaceId, ownerUserId } = getWorkspaceContext(req);
  const workspaceData = {
    name: "Workspace",
    slug: workspaceId,
    ownerUserId,
    timezone: "America/Chicago",
    status: "active",
    branding: {},
    settings: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, "workspaces", workspaceId), workspaceData);
  return NextResponse.json({ success: true, workspaceId });
}

export async function GET(req: Request) {
  const { workspaceId } = getWorkspaceContext(req);
  const ref = doc(db, "workspaces", workspaceId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return NextResponse.json({ exists: false });
  }
  return NextResponse.json({ exists: true, data: snap.data() });
}
