import { NextResponse } from "next/server";
import { createWorkspaceInvite, sendWorkspaceInviteEmail } from "@/lib/workspaceInvites";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { workspaceId, email, role, invitedBy, expiresAtMs } = body;
    const { inviteId, token, expiresAt } = await createWorkspaceInvite({
      workspaceId,
      email,
      role,
      invitedBy,
      expiresAtMs,
    });

    // Email delivery stub: replace with provider integration.
    await sendWorkspaceInviteEmail({ email, token, workspaceId });

    return NextResponse.json({ inviteId, expiresAt });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create invite" }, { status: 400 });
  }
}
