// src/scripts/seedInvoices.ts
// Usage: npx ts-node src/scripts/seedInvoices.ts

import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function seedInvoices() {
  const workspaceId = "demo-workspace"; // Change as needed
  const invoices = [
    {
      invoiceNumber: "INV-1001",
      customerName: "Acme Corp",
      dueDate: new Date(),
      status: "sent",
      total: 1200.5,
      workspaceId,
    },
    {
      invoiceNumber: "INV-1002",
      customerName: "Beta LLC",
      dueDate: new Date(Date.now() + 86400000 * 7),
      status: "draft",
      total: 800,
      workspaceId,
    },
  ];

  for (const invoice of invoices) {
    await db
      .collection("billing")
      .doc("invoices")
      .collection("invoices")
      .add(invoice);
    // Or: await db.collection('billing/invoices').add(invoice); if using a flat collection
  }
  console.log("Seeded invoices!");
}

seedInvoices().catch(console.error);
