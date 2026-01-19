import "dotenv/config";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// Define workflow packs
const WORKFLOW_PACKS = [
  {
    key: "basic_pack",
    name: "Basic Workflow Pack",
    description: "Includes essential automations like 'Zero Follow-Up Leak' and 'Instant Invoice on Job Complete'.",
    unitAmountCents: 9900,
    currency: "usd",
    tier: "basic",
  },
  {
    key: "advanced_pack",
    name: "Advanced Workflow Pack",
    description: "Includes advanced automations like 'No-Show Recovery System' and 'Price Protection Engine'.",
    unitAmountCents: 29900,
    currency: "usd",
    tier: "advanced",
  },
  {
    key: "enterprise_pack",
    name: "Enterprise Workflow Pack",
    description: "Includes all advanced automations plus 'Installer Load Balancer' and custom workflows.",
    unitAmountCents: 49900,
    currency: "usd",
    tier: "enterprise",
  },
];

async function ensureWorkflowPackProduct(pack: typeof WORKFLOW_PACKS[0]) {
  const products = await stripe.products.list({ limit: 100, active: true });
  const existing = products.data.find((p) => p.metadata?.workflow_pack_key === pack.key);
  if (existing) {
    const updated = await stripe.products.update(existing.id, {
      name: pack.name,
      description: pack.description,
      active: true,
      metadata: { workflow_pack_key: pack.key, tier: pack.tier },
    });
    return { product: updated, created: false };
  }
  const created = await stripe.products.create({
    name: pack.name,
    description: pack.description,
    active: true,
    metadata: { workflow_pack_key: pack.key, tier: pack.tier },
  });
  return { product: created, created: true };
}

async function ensureMonthlyRecurringPrice(pack: typeof WORKFLOW_PACKS[0], productId: string) {
  const prices = await stripe.prices.list({ product: productId, limit: 100, active: true });
  const existing = prices.data.find(
    (p) =>
      p.type === "recurring" &&
      p.recurring?.interval === "month" &&
      p.currency === pack.currency &&
      p.unit_amount === pack.unitAmountCents
  );
  if (existing) return { price: existing, created: false };
  const created = await stripe.prices.create({
    product: productId,
    currency: pack.currency,
    unit_amount: pack.unitAmountCents,
    recurring: { interval: "month" },
    nickname: `${pack.key}_monthly`,
    metadata: { workflow_pack_key: pack.key, tier: pack.tier },
  });
  return { price: created, created: true };
}

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY in env");
  }
  console.log("Creating/Updating Stripe Workflow Packs + Prices...\n");
  const output: Array<{ key: string; productId: string; priceIdMonthly: string | null }> = [];
  for (const pack of WORKFLOW_PACKS) {
    const { product, created } = await ensureWorkflowPackProduct(pack);
    const priceRes = await ensureMonthlyRecurringPrice(pack, product.id);
    console.log(`✅ ${pack.name}`);
    console.log(`   Product: ${product.id} (${created ? "created" : "updated"})`);
    if (priceRes?.price) {
      console.log(`   Monthly Price: ${priceRes.price.id} (${priceRes.created ? "created" : "reused"})`);
    } else {
      console.log(`   Monthly Price: (none)`);
    }
    output.push({ key: pack.key, productId: product.id, priceIdMonthly: priceRes?.price?.id ?? null });
  }
  console.log("----- COPY THESE INTO YOUR ENV / CONFIG -----");
  for (const row of output) {
    console.log(`STRIPE_PRICE_${row.key.toUpperCase()}=${row.priceIdMonthly}`);
  }
  console.log("--------------------------------------------\n");
  console.log("JSON mapping (store in your app):");
  console.log(JSON.stringify(output, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
