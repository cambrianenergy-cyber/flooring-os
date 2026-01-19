/**
 * Fully-idempotent Stripe Products + Prices setup
 * Pattern: create new price if amount changed + deactivate old prices
 *
 * Requires:
 *   npm i stripe dotenv
 * Run:
 *   STRIPE_SECRET_KEY=sk_test_or_live_xxx node stripe.setup.idempotent.js
 *
 * Optional env:
 *   STRIPE_DEFAULT_CURRENCY=usd
 */

require("dotenv").config();
const Stripe = require("stripe");

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
	console.error("Missing STRIPE_SECRET_KEY in env.");
	process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
	apiVersion: "2024-06-20",
});

const CURRENCY = (process.env.STRIPE_DEFAULT_CURRENCY || "usd").toLowerCase();
const APP_KEY = "squareos";

/** ------------------------------
 * PLANS (edit freely)
 * ------------------------------ */
const plans = [
	{
		key: "plan_1",
		name: "Square Start",
		amountMonthly: 49900,
		teamLimit: 5,
		description:
			"For small crews getting organized with light AI help and core workflow tools.",
		features: [
			"Up to 5 team members",
			"Core job + customer management",
			"Basic estimates + proposals",
			"Limited AI assistance",
			"Standard support",
		],
	},
	{
		key: "plan_2",
		name: "Square Scale",
		amountMonthly: 79900,
		teamLimit: 15,
		description:
			"For growing teams that need more automation, deeper AI help, and better operations control.",
		features: [
			"Up to 15 team members",
			"Advanced job workflows + approvals",
			"Enhanced estimate intelligence",
			"More AI assistance + templates",
			"Priority support",
		],
	},
	{
		key: "plan_3",
		name: "Square Pro",
		amountMonthly: 99900,
		teamLimit: 50,
		description:
			"For serious operators: unlocked automation, premium AI, and higher-leverage workflows.",
		features: [
			"Up to 50 team members",
			"AI workflow packs + automation rules",
			"Unified inbox + follow-up engine",
			"Lead scoring + next-best-action",
			"Agency mode / multi-branch tooling",
			"Premium support",
		],
	},
	{
		key: "plan_4",
		name: "Square Elite",
		amountMonthly: 149900, // EDIT OR REMOVE IF NOT USING
		teamLimit: 200,
		description:
			"For multi-location contractors: maximum AI, governance, and enterprise-grade controls.",
		features: [
			"Up to 200 team members",
			"Founder/admin governance controls",
			"SLA + dedicated onboarding",
			"Custom workflow marketplace access",
			"Maximum AI + advanced analytics",
			"Enterprise support",
		],
	},
];

/** ------------------------------
 * Helpers
 * ------------------------------ */

async function findProductByKey(productKey) {
	const query = `active:'true' AND metadata['app']:'${APP_KEY}' AND metadata['key']:'${productKey}'`;
	const res = await stripe.products.search({ query, limit: 1 });
	return res.data[0] || null;
}

async function createOrUpdateProduct({ key, name, description, features }) {
	const existing = await findProductByKey(key);
	const metadata = {
		app: APP_KEY,
		key,
		features_json: JSON.stringify(features || []),
	};

	if (existing) {
		return await stripe.products.update(existing.id, { name, description, metadata });
	}

	return await stripe.products.create({ name, description, metadata });
}

async function listAllPricesForProduct(productId) {
	// list() is paginated; iterate
	const out = [];
	let starting_after = undefined;
	while (true) {
		const page = await stripe.prices.list({
			product: productId,
			limit: 100,
			starting_after,
		});
		out.push(...page.data);
		if (!page.has_more) break;
		starting_after = page.data[page.data.length - 1].id;
	}
	return out;
}

function isMonthlyRecurring(price) {
	return (
		price.type === "recurring" &&
		price.recurring &&
		price.recurring.interval === "month" &&
		price.recurring.usage_type !== "metered"
	);
}

function sameCurrency(price) {
	return (price.currency || "").toLowerCase() === CURRENCY;
}

function activeMonthlyPrices(prices) {
	return prices.filter((p) => p.active && isMonthlyRecurring(p) && sameCurrency(p));
}

function nowStamp() {
	const d = new Date();
	const yyyy = d.getUTCFullYear();
	const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
	const dd = String(d.getUTCDate()).padStart(2, "0");
	const hh = String(d.getUTCHours()).padStart(2, "0");
	const mi = String(d.getUTCMinutes()).padStart(2, "0");
	return `${yyyy}${mm}${dd}_${hh}${mi}UTC`;
}

/**
 * Ensures exactly one active monthly price for product/currency and that it matches amount.
 * - If none exist: create one
 * - If exists and matches: keep
 * - If exists and differs: create new + deactivate all old active monthly prices
 *
 * Uses lookup_key strategy:
 *   current lookup_key is deterministic: `${APP_KEY}__${planKey}__monthly__current__${currency}`
 *   old prices get their lookup_key moved to archived: `${...}__archived__${stamp}`
 */
async function ensureMonthlyPrice({ productId, planKey, amountMonthly, nickname }) {
	const prices = await listAllPricesForProduct(productId);
	const active = activeMonthlyPrices(prices);

	const currentLookupKey = `${APP_KEY}__${planKey}__monthly__current__${CURRENCY}`;

	// If we already have an active monthly price that matches the amount, prefer it.
	const matching = active.find((p) => p.unit_amount === amountMonthly);
	if (matching) {
		// Ensure its lookup_key is set to "current" (best-effort; if it differs, create a new price would be overkill)
		// Stripe supports setting lookup_key on create; updating lookup_key is supported for Prices in most accounts,
		// but if your account/API rejects, we just keep going.
		try {
			if (matching.lookup_key !== currentLookupKey) {
				await stripe.prices.update(matching.id, {
					lookup_key: currentLookupKey,
					metadata: {
						...(matching.metadata || {}),
						app: APP_KEY,
						plan_key: planKey,
						role: "current",
					},
				});
			}
		} catch (_) {
			// ignore: not critical; you can still reference by price_id saved in your DB
		}
		return { price: matching, changed: false, deactivated: [] };
	}

	// Otherwise create a new price and deactivate all old active monthly prices
	const newPrice = await stripe.prices.create({
		product: productId,
		currency: CURRENCY,
		unit_amount: amountMonthly,
		recurring: { interval: "month" },
		lookup_key: currentLookupKey,
		nickname,
		metadata: {
			app: APP_KEY,
			plan_key: planKey,
			role: "current",
			created_reason: active.length ? "amount_changed" : "initial_create",
		},
	});

	const stamp = nowStamp();
	const deactivated = [];

	for (const old of active) {
		// Deactivate old
		await stripe.prices.update(old.id, {
			active: false,
			metadata: {
				...(old.metadata || {}),
				app: APP_KEY,
				plan_key: planKey,
				role: "archived",
				archived_at: stamp,
			},
			// Move lookup_key off of "current" if it had it
			// (prevents lookup_key collisions / ambiguity)
			lookup_key:
				old.lookup_key && old.lookup_key.includes("__current__")
					? `${APP_KEY}__${planKey}__monthly__archived__${stamp}__${CURRENCY}`
					: old.lookup_key || undefined,
		});

		deactivated.push(old.id);
	}

	return { price: newPrice, changed: true, deactivated };
}

/** ------------------------------
 * MAIN
 * ------------------------------ */
(async function main() {
	console.log(`\nStripe idempotent setup starting… (currency=${CURRENCY})\n`);

	const outputs = {
		app: APP_KEY,
		currency: CURRENCY,
		plans: {},
	};

	for (const p of plans) {
		const product = await createOrUpdateProduct({
			key: p.key,
			name: p.name,
			description: p.description,
			features: p.features,
		});

		const { price, changed, deactivated } = await ensureMonthlyPrice({
			productId: product.id,
			planKey: p.key,
			amountMonthly: p.amountMonthly,
			nickname: `${p.name} — Monthly (${CURRENCY.toUpperCase()})`,
		});

		outputs.plans[p.key] = {
			name: p.name,
			product_id: product.id,
			current_price_id: price.id,
			current_price_lookup_key: `${APP_KEY}__${p.key}__monthly__current__${CURRENCY}`,
			amount_monthly: p.amountMonthly,
			team_limit: p.teamLimit,
			changed,
			deactivated_prices: deactivated,
		};

		console.log(
			`✅ ${p.name}\n   Product: ${product.id}\n   Current Price: ${price.id}\n   Amount: ${p.amountMonthly}\n   ${changed ? `Deactivated: ${deactivated.join(", ") || "none"}` : "No change"}\n`
		);
	}

	console.log("----- COPY/PASTE CONFIG (JSON) -----");
	console.log(JSON.stringify(outputs, null, 2));
	console.log("------------------------------------\n");
	console.log("Done.");
})().catch((err) => {
	console.error("\n❌ Stripe setup failed:\n", err?.raw || err);
	process.exit(1);
});
