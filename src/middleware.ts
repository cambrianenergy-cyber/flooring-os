import { NextResponse } from "next/server";

export async function middleware(request: Request) {
  const { pathname } = new URL(request.url);
  // Allow onboarding and billing routes
  if (pathname.startsWith("/onboarding") || pathname.startsWith("/billing")) {
    return NextResponse.next();
  }
  // Example: check authentication from cookies/session
  const cookies = request.headers.get('cookie') || '';
  const getCookie = (name: string) => {
    const match = cookies.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : undefined;
  };
  const uid = getCookie("uid");
  if (!uid) {
    // Not authenticated, let Next.js handle
    return NextResponse.next();
  }
  // Placeholder: get onboarding/billing status from cookie/session/JWT
  const onboardingComplete = getCookie("onboardingComplete") === "true";
  const billingActive = getCookie("billingActive") === "true";
  const role = getCookie("role") || "viewer";
  if (!onboardingComplete) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }
  if (!billingActive && role !== "founder") {
    return NextResponse.redirect(new URL("/billing", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|onboarding|billing|static|favicon.ico).*)"],
};
