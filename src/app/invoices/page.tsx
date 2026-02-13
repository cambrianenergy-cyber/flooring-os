"use client";
import { db } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

type Invoice = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  dueDate: Date | { toDate: () => Date } | number;
  status: string;
  total: number;
  workspaceId?: string;
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        const demoInvoices = [
          {
            id: "inv1",

            invoiceNumber: "INV-1001",
            customerName: "Acme Corp",
            dueDate: new Date(),
            status: "sent",
            total: 1200.5,
          },
          {
            id: "inv2",
            invoiceNumber: "INV-1002",
            customerName: "Beta LLC",
            dueDate: new Date(Date.now() + 86400000 * 7),
            status: "draft",
            total: 800,
          },
        ];
        // If not authenticated, or no real data, use demo
        if (!user) {
          setInvoices(demoInvoices);
          return;
        }
        // Fetch workspaceId from user profile
        const userDocSnap = await getDocs(query(collection(db, "users")));
        let workspaceId = "";
        userDocSnap.forEach((docSnap) => {
          if (docSnap.id === user.uid) {
            workspaceId = docSnap.data().workspaceId || "";
          }
        });
        if (!workspaceId) {
          setInvoices(demoInvoices);
          return;
        }
        // Query invoices under /billing/invoices where workspaceId matches
        const q = query(
          collection(db, "billing/invoices"),
          orderBy("dueDate", "asc"),
          limit(80),
        );
        const snap = await getDocs(q);
        const filtered = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Invoice)
          .filter((inv) => inv.workspaceId === workspaceId);
        setInvoices(filtered);
      } catch (err) {
        // handle error (optional)
        setInvoices([]);
      }
    }
    fetchInvoices();
  }, []);
  ("use client");
  // ...existing code...
  return (
    <div>
      {invoices.length === 0 ? (
        <div>No invoices found.</div>
      ) : (
        <table
          style={{ width: "100%", borderCollapse: "collapse", marginTop: 24 }}
        >
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ccc", padding: 8 }}>
                Invoice #
              </th>
              <th style={{ borderBottom: "1px solid #ccc", padding: 8 }}>
                Customer
              </th>
              <th style={{ borderBottom: "1px solid #ccc", padding: 8 }}>
                Due Date
              </th>
              <th style={{ borderBottom: "1px solid #ccc", padding: 8 }}>
                Status
              </th>
              <th style={{ borderBottom: "1px solid #ccc", padding: 8 }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                  {inv.invoiceNumber || inv.id}
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                  {inv.customerName || "-"}
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                  {inv.dueDate
                    ? typeof inv.dueDate === "object" && "toDate" in inv.dueDate
                      ? inv.dueDate.toDate().toLocaleDateString()
                      : inv.dueDate instanceof Date
                        ? inv.dueDate.toLocaleDateString()
                        : new Date(inv.dueDate).toLocaleDateString()
                    : "-"}
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                  {inv.status || "-"}
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                  {typeof inv.total === "number"
                    ? `$${inv.total.toFixed(2)}`
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
