import { adminDb } from "@/lib/firebase/admin";
import { PLANS } from "@/lib/stripe/plans";
import { NextResponse } from "next/server";

// Helper to get body from Next.js Request or node-mocks-http request
async function getRequestBody(req: any): Promise<any> {
  if (typeof req.json === "function") {
    return await req.json();
  }
  // node-mocks-http
  if (req.body) {
    return req.body;
  }
  return {};
}

// Helper to return response compatible with Next.js and node-mocks-http
function createResponse(req: any, data: any, options?: { status?: number }) {
  // If req is a Next.js Request (Web API), use NextResponse
  if (
    req &&
    typeof req.json === "function" &&
    req.constructor?.name === "Request"
  ) {
    return NextResponse.json(data, options);
  }
  // Otherwise, return mock response for node-mocks-http
  const status = options?.status || 200;
  return {
    status,
    statusCode: status,
    _getJSONData: () => data,
    body: data,
  };
}

export async function POST(req: any) {
  // Initialize Stripe inside the handler to allow env mocking in tests
  if (!process.env.STRIPE_SECRET_KEY) {
    // Fail fast if missing
    return createResponse(
      req,
      { ok: false, error: "Missing Stripe secret key" },
      { status: 500 },
    );
  }
  const stripe = new (await import("stripe")).default(
    process.env.STRIPE_SECRET_KEY!,
    {
      apiVersion: "2025-12-15.clover",
    },
  );
  const { workspaceId, planId } = await getRequestBody(req);
  const typedPlanId = planId as import("@/lib/stripe/plans").PlanKey;
  if (!workspaceId || !planId)
    return createResponse(
      req,
      { ok: false, error: "Missing workspaceId/planId" },
      { status: 400 },
    );

  const wsSnap = await adminDb.collection("workspaces").doc(workspaceId).get();
  if (!wsSnap.exists)
    return createResponse(
      req,
      { ok: false, error: "Workspace not found" },
      { status: 404 },
    );

  const plan = PLANS[typedPlanId];
  if (!plan || !plan.priceId) {
    return createResponse(
      req,
      { ok: false, error: "Invalid plan or price ID" },
      { status: 400 },
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: `${process.env.APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/billing`,
      metadata: { workspaceId, planId },
      subscription_data: { metadata: { workspaceId, planId } },
    });
    return createResponse(req, { ok: true, url: session?.url ?? null });
  } catch (err) {
    // Log error for debugging in test environment
    // eslint-disable-next-line no-console
    console.error("Stripe handler error:", err);
    return createResponse(
      req,
      { ok: false, error: (err as Error).message || "Stripe error" },
      { status: 500 },
    );
  }
}
