import { NextResponse } from "next/server";
import { expireWorkspaceInvites } from "@/lib/workspaceInvites";

export async function POST() {
  const result = await expireWorkspaceInvites();
  return NextResponse.json(result);
}
