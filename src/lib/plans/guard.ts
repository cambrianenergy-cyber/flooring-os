import { NextResponse } from "next/server";
//
import { checkEntitlement } from "./entitlements";
import type { EntitlementInput } from "./entitlements";

export function enforceEntitlement<T>(input: EntitlementInput, onAllow: () => T | Promise<T>): T | Promise<T | ReturnType<typeof NextResponse.json>> {
  const gate = checkEntitlement(input);
  if (!gate.ok) {
    const status = gate.code === "LIMIT_REACHED" ? 429 : 403;
    return NextResponse.json({ ok: false, error: gate.reason, code: gate.code }, { status });
  }
  return onAllow();
}
