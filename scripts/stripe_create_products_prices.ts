import "dotenv/config";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

type PlanKey = "foundation" | "momentum" | "command" | "dominion";

type PlanSeed = {
  key: PlanKey;
  name: string;
  statementDescriptor?: string;
  description: string;
  unitAmountCents?: number;
  currency?: string;
  maxUsers: number | "unlimited";
  aiTier: "assist" | "copilot" | "operator" | "orchestrator";
  monthlyAiCredits: number | "unlimited";
  workflowEnabled: boolean;
  workflowMaxRunsPerMonth: number | "unlimited";
  allowAutonomous: boolean;
  features: {
    docusign: boolean;
    payments: boolean;
    pricingEngine: boolean;
    multiLocation: boolean;
    apiAccess: boolean;
  };
};

const PLANS: PlanSeed[] = [
  {
    key: "foundation",
    name: "Square Flooring — Foundation",
    description:
      "Operations backbone for small teams. Limited AI assistance. Up to 5 team members.",
    unitAmountCents: 49900,
    currency: "usd",
    maxUsers: 5,
    aiTier: "assist",
    monthlyAiCredits: 500,
    workflowEnabled: false,
    workflowMaxRunsPerMonth: 0,
    allowAutonomous: false,
    features: {
      docusign: false,
      payments: false,
      pricingEngine: false,
      multiLocation: false,
      apiAccess: false,
    },
  },
  {
    key: "momentum",
    name: "Square Flooring — Momentum",
    description:
      "Automation starts pulling real weight. More AI help. Up to 15 team members.",
    unitAmountCents: 79900,
    currency: "usd",
    maxUsers: 15,
    aiTier: "copilot",
    monthlyAiCredits: 1500,
    workflowEnabled: true,
    workflowMaxRunsPerMonth: 200,
    allowAutonomous: false,
    features: {
      docusign: true,
      payments: true,
      pricingEngine: false,
      multiLocation: false,
      apiAccess: false,
    },
  },
  {
    key: "command",
    name: "Square Flooring — Command",
    description:
      "AI operates with guardrails. Advanced workflows and pricing intelligence. Up to 30 team members.",
    unitAmountCents: 99900,
    currency: "usd",
    maxUsers: 30,
    aiTier: "operator",
    monthlyAiCredits: 5000,
    workflowEnabled: true,
    workflowMaxRunsPerMonth: "unlimited",
    allowAutonomous: true,
    features: {
      docusign: true,
      payments: true,
      pricingEngine: true,
      multiLocation: true,
      apiAccess: false,
    },
  },
  {
    key: "dominion",
    name: "Square Flooring — Dominion",
    description:
      "Enterprise orchestration. Replace departments. Unlimited team members. Custom pricing.",
    currency: "usd",
    maxUsers: "unlimited",
    aiTier: "orchestrator",
    monthlyAiCredits: "unlimited",
    workflowEnabled: true,
    workflowMaxRunsPerMonth: "unlimited",
    allowAutonomous: true,
    features: {
      docusign: true,
      payments: true,
      pricingEngine: true,
      multiLocation: true,
      apiAccess: true,
    },
  },
];

function md(val: unknown) {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "boolean") return val ? "true" : "false";
  return JSON.stringify(val);
}

async function findExistingProduct(planKey: PlanKey, name: string) {
  const products = await stripe.products.list({ limit: 100, active: true });
  const byMeta = products.data.find((p) => p.metadata?.plan_key === planKey);
  if (byMeta) return byMeta;
  const byName = products.data.find((p) => p.name === name);
  if (byName) return byName;
  let startingAfter: string | undefined;
  while (products.has_more) {
    startingAfter = products.data[products.data.length - 1].id;
    const next = await stripe.products.list({
      limit: 100,
      active: true,
      starting_after: startingAfter,
    });
    const hit = next.data.find((p) => p.metadata?.plan_key === planKey) || next.data.find((p) => p.name === name);
    if (hit) return hit;
    if (!next.has_more) break;
  }
  return null;
}

async function ensureProduct(plan: PlanSeed) {
  const existing = await findExistingProduct(plan.key, plan.name);
  const productPayload: Stripe.ProductCreateParams = {
    name: plan.name,
    description: plan.description,
    active: true,
    metadata: {
      plan_key: plan.key,
      max_users: md(plan.maxUsers),
      ai_tier: md(plan.aiTier),
      monthly_ai_credits: md(plan.monthlyAiCredits),
      workflow_enabled: md(plan.workflowEnabled),
      workflow_max_runs_per_month: md(plan.workflowMaxRunsPerMonth),
      workflow_allow_autonomous: md(plan.allowAutonomous),
      feature_docusign: md(plan.features.docusign),
      feature_payments: md(plan.features.payments),
      feature_pricing_engine: md(plan.features.pricingEngine),
      feature_multi_location: md(plan.features.multiLocation),
      feature_api_access: md(plan.features.apiAccess),
    },
  };
  if (existing) {
    const updated = await stripe.products.update(existing.id, productPayload as Stripe.ProductUpdateParams);
    return { product: updated, created: false };
  }
  const created = await stripe.products.create(productPayload);
  return { product: created, created: true };
}

async function findExistingMonthlyPrice(productId: string, unitAmountCents: number, currency = "usd") {
  const prices = await stripe.prices.list({ product: productId, limit: 100, active: true });
  return prices.data.find(
    (p) =>
      p.type === "recurring" &&
      p.recurring?.interval === "month" &&
      p.currency === currency &&
      p.unit_amount === unitAmountCents
  );
}

async function ensureMonthlyRecurringPrice(plan: PlanSeed, productId: string) {
  if (!plan.unitAmountCents) return null;
  const existing = await findExistingMonthlyPrice(productId, plan.unitAmountCents, plan.currency || "usd");
  if (existing) return { price: existing, created: false };
  const created = await stripe.prices.create({
    product: productId,
    currency: plan.currency || "usd",
    unit_amount: plan.unitAmountCents,
    recurring: { interval: "month" },
    nickname: `${plan.key}_monthly`,
    metadata: {
      plan_key: plan.key,
      billing_interval: "month",
      max_users: md(plan.maxUsers),
      ai_tier: md(plan.aiTier),
      monthly_ai_credits: md(plan.monthlyAiCredits),
    },
  });
  return { price: created, created: true };
}

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY in env");
  }
  console.log("Creating/Updating Stripe Products + Prices...\n");
  const output: Array<{
    planKey: PlanKey;
    productId: string;
    priceIdMonthly: string | null;
  }> = [];
  for (const plan of PLANS) {
    const { product, created } = await ensureProduct(plan);
    const priceRes = await ensureMonthlyRecurringPrice(plan, product.id);
    console.log(`✅ ${plan.key.toUpperCase()}`);
    console.log(`   Product: ${product.id} (${created ? "created" : "updated"})`);
    if (priceRes?.price) {
      console.log(`   Monthly Price: ${priceRes.price.id} (${priceRes.created ? "created" : "reused"})`);
    } else {
      console.log(`   Monthly Price: (none) — custom pricing / sales-assisted`);
    }
    console.log("");
    output.push({
      planKey: plan.key,
      productId: product.id,
      priceIdMonthly: priceRes?.price?.id ?? null,
    });
  }
  console.log("----- COPY THESE INTO YOUR ENV / CONFIG -----");
  for (const row of output) {
    if (row.planKey === "foundation") console.log(`STRIPE_PRICE_FOUNDATION=${row.priceIdMonthly}`);
    if (row.planKey === "momentum") console.log(`STRIPE_PRICE_MOMENTUM=${row.priceIdMonthly}`);
    if (row.planKey === "command") console.log(`STRIPE_PRICE_COMMAND=${row.priceIdMonthly}`);
    if (row.planKey === "dominion") console.log(`STRIPE_PRODUCT_DOMINION=${row.productId}`);
  }
  console.log("--------------------------------------------\n");
  console.log("JSON mapping (store in your app):");
  console.log(JSON.stringify(output, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
