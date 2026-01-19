// scripts/sync_stripe_env_from_live.js
// Syncs .env.local with live Stripe price IDs and planKeys from Stripe API
// Usage: node scripts/sync_stripe_env_from_live.js

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import Stripe from "stripe";
dotenv.config();

console.log('Loaded STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY);
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error('Missing STRIPE_SECRET_KEY in env.');
  console.error('Current working directory:', process.cwd());
  console.error('Did you run from the project root? Is .env.local present and correct?');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

async function main() {
  const prices = await stripe.prices.list({ limit: 100, active: true });
  const planMap = {};
  for (const price of prices.data) {
    const planKey = price.metadata?.plan_key || price.lookup_key;
    if (!planKey) continue;
    planMap[planKey] = price.id;
  }
  if (Object.keys(planMap).length === 0) {
    console.error('No planKey or lookup_key found in Stripe prices.');
    process.exit(1);
  }
  // Read .env.local
  const envPath = path.resolve(process.cwd(), '.env.local');
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  // Update or insert STRIPE_PRICE_* lines
  for (const [planKey, priceId] of Object.entries(planMap)) {
    const envVar = `STRIPE_PRICE_${planKey.toUpperCase()}`;
    const regex = new RegExp(`^${envVar}=.*$`, 'm');
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${envVar}=${priceId}`);
    } else {
      envContent += `\n${envVar}=${priceId}`;
    }
  }
  fs.writeFileSync(envPath, envContent.trim() + '\n');
  console.log('Updated .env.local with live Stripe price IDs:');
  for (const [planKey, priceId] of Object.entries(planMap)) {
    console.log(`  STRIPE_PRICE_${planKey.toUpperCase()}=${priceId}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
