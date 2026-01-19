import { NextRequest, NextResponse } from "next/server";
import { acceptWorkspaceInvite } from "@/lib/workspaceInvites";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { workspaceId, token, userId } = body;
    const { inviteId, memberId } = await acceptWorkspaceInvite({ workspaceId, token, userId });
    return NextResponse.json({ inviteId, memberId });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to accept invite" }, { status: 400 });
  }
}
