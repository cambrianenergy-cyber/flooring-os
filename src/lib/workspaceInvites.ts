
// --- STATIC EXPORT STUBS ONLY ---

export async function createWorkspaceInvite(): Promise<{ inviteId: string; token: string; expiresAt: number }> {
  // Static export stub: always returns fake invite
  return { inviteId: "stub-invite-id", token: "stub-token", expiresAt: Date.now() + 1000000 };
}

export async function acceptWorkspaceInvite(): Promise<{ inviteId: string; memberId: string }> {
  // Static export stub: always returns fake acceptance
  return { inviteId: "stub-invite-id", memberId: "stub-member-id" };
}

export async function expireWorkspaceInvites(): Promise<{ expired: number }> {
  // Static export stub: always returns 0 expired
  return { expired: 0 };
}

export async function sendWorkspaceInviteEmail(params: { email: string; token: string; workspaceId: string }) {
  // Stub for production email delivery; replace with your provider (SendGrid, SES, etc.).
  console.info("Workspace invite email", params);
}
