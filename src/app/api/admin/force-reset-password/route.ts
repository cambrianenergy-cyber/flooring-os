import { NextResponse } from "next/server";
import { isFounder } from "@/lib/auth-utils";
import { writeAuditLog } from "@/lib/auditLoggerAdmin";

export async function POST(req: Request) {
  const { email, newPassword } = await req.json();
  if (!email || !newPassword) {
    return NextResponse.json({ error: "Missing email or newPassword" }, { status: 400 });
  }

  // Extract actor info from headers
  const actorEmail = req.headers.get("x-email") || "";
  if (!isFounder(actorEmail)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  // Reset password using Firebase Admin SDK
  try {
    const admin = await import("firebase-admin");
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(user.uid, { password: newPassword });

    // Audit log
    await writeAuditLog({
      workspaceId: "system", // Not workspace-specific
      actorType: "user",
      actorId: actorEmail,
      action: "force-reset-password",
      entityType: "user",
      entityId: user.uid,
      meta: { email, actorEmail },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err && typeof err === "object" && "message" in err ? (err as { message?: string }).message : undefined;
    return NextResponse.json({ error: message || "Failed to reset password" }, { status: 500 });
  }
}
