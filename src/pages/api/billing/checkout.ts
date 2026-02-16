import { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "@/lib/billing";
import { PLANS } from "@/lib/stripe/plans";

// POST /api/billing/checkout
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { workspaceId, planKey, userId } = req.body;
  if (!workspaceId || !planKey) {
    return res.status(400).json({ error: "Missing workspaceId or planKey" });
  }
  const plan = PLANS[planKey as keyof typeof PLANS];
  if (!plan || !plan.priceId) {
    return res.status(400).json({ error: "Invalid planKey or missing Stripe priceId" });
  }
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        workspaceId,
        planKey,
        ...(userId ? { userId } : {}),
      },
      subscription_data: {
        metadata: {
          workspaceId,
          planKey,
          ...(userId ? { userId } : {}),
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || "http://localhost:3000"}/billing/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || "http://localhost:3000"}/billing`,
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
}
