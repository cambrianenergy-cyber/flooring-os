"use client";
import { db } from "@/lib/firebase";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

// Fallback accessories; real ones are loaded from accessories_catalog if available
const FALLBACK_ACCESSORIES = [
  { id: "a1", name: "Underlayment", price: 0.5 },
  { id: "a2", name: "Reducer", price: 1.0 },
  { id: "a3", name: "Tack Strip", price: 0.3 },
  { id: "a4", name: "Seam Tape", price: 0.2 },
];

export default function EstimateBuilder({
  onEstimateSaved,
  autoFill,
}: {
  onEstimateSaved?: () => void;
  autoFill?: { sqft: number; waste: number; linearFt: number } | null;
}) {
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [accessories, setAccessories] = useState<any[]>(FALLBACK_ACCESSORIES);
  const [loadingAccessories, setLoadingAccessories] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [sqft, setSqft] = useState(autoFill?.sqft || 0);
  const [wastePct, setWastePct] = useState(autoFill?.waste ?? 10);
  const [linearFt, setLinearFt] = useState(autoFill?.linearFt ?? 0);
  const [selectedAccessories, setSelectedAccessories] = useState<any[]>([]);
  const [margin, setMargin] = useState(20); // percent
  const [commission, setCommission] = useState(5); // percent
  const [saving, setSaving] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  // Advanced: editable line items
  const [lineItems, setLineItems] = useState<any[]>([]);

  // Resolve workspaceId from localStorage (aligned with other screens)
  useEffect(() => {
    const ws =
      typeof window === "undefined"
        ? ""
        : localStorage.getItem("workspaceId") || "";
    setWorkspaceId(ws);
  }, []);

  // Fetch products for this workspace
  useEffect(() => {
    async function loadProducts() {
      if (!workspaceId) {
        setLoadingProducts(false);
        return;
      }
      try {
        const q = query(
          collection(db, "products"),
          where("workspaceId", "==", workspaceId),
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProducts(list);
      } finally {
        setLoadingProducts(false);
      }
    }
    loadProducts();
  }, [workspaceId]);

  // Load accessories from accessories_catalog; workspace-scoped if available
  useEffect(() => {
    async function loadAccessories() {
      try {
        let snap;
        if (workspaceId) {
          const q = query(
            collection(db, "accessories_catalog"),
            where("workspaceId", "==", workspaceId),
          );
          snap = await getDocs(q);
          if (snap.empty) {
            snap = await getDocs(collection(db, "accessories_catalog"));
          }
        } else {
          snap = await getDocs(collection(db, "accessories_catalog"));
        }
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAccessories(list.length ? list : FALLBACK_ACCESSORIES);
      } catch {
        setAccessories(FALLBACK_ACCESSORIES);
      } finally {
        setLoadingAccessories(false);
      }
    }
    loadAccessories();
  }, [workspaceId]);

  const effectiveSqft = useMemo(() => {
    const base = Number(sqft) || 0;
    const pct = Number(wastePct) || 0;
    return Math.max(0, base * (1 + pct / 100));
  }, [sqft, wastePct]);

  // Context-aware accessories suggestion logic
  function getSuggestedAccessories() {
    if (!selectedProduct) return [];
    const productAcc = selectedProduct.accessories || [];
    const lineItemAcc = lineItems
      .map((li) => {
        const name = li.name.toLowerCase();
        if (name.includes("stairs")) return "Reducer";
        if (name.includes("carpet")) return "Tack Strip";
        if (name.includes("transition")) return "Reducer";
        if (name.includes("door")) return "Reducer";
        if (name.includes("tile")) return "Underlayment";
        return null;
      })
      .filter(Boolean);
    // Merge and dedupe
    return Array.from(new Set([...productAcc, ...lineItemAcc]));
  }

  const handleAccessoryToggle = (acc: any) => {
    setSelectedAccessories((prev) =>
      prev.some((a) => a.id === acc.id)
        ? prev.filter((a) => a.id !== acc.id)
        : [...prev, acc],
    );
  };

  // Advanced: add/remove line items
  function addLineItem() {
    setLineItems([...lineItems, { name: "", qty: 1, price: 0 }]);
  }
  function updateLineItem(idx: number, key: string, value: any) {
    setLineItems(
      lineItems.map((li, i) => (i === idx ? { ...li, [key]: value } : li)),
    );
  }
  function removeLineItem(idx: number) {
    setLineItems(lineItems.filter((_, i) => i !== idx));
  }

  const productCost = selectedProduct
    ? (selectedProduct.price || selectedProduct.pricePerSqft || 0) *
      effectiveSqft
    : 0;
  const accessoriesCost = selectedAccessories.reduce(
    (sum, a) => sum + (a.price ?? a.sellPrice ?? 0) * effectiveSqft,
    0,
  );
  const lineItemsCost = lineItems.reduce(
    (sum, li) => sum + Number(li.qty) * Number(li.price),
    0,
  );
  const subtotal = productCost + accessoriesCost + lineItemsCost;
  const marginAmount = subtotal * (margin / 100);
  const commissionAmount = subtotal * (commission / 100);
  const total = subtotal + marginAmount + commissionAmount;

  const handleSaveEstimate = async () => {
    setSaving(true);
    try {
      await addDoc(collection(db, "estimates"), {
        product: selectedProduct,
        sqft,
        wastePct,
        effectiveSqft,
        linearFt,
        accessories: selectedAccessories,
        lineItems,
        margin,
        commission,
        total,
        workspaceId,
        created: new Date().toISOString(),
      });
      setSaving(false);
      if (onEstimateSaved) onEstimateSaved();
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "success", message: "Estimate saved!" },
        }),
      );
    } catch (e) {
      setSaving(false);
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "error", message: "Failed to save estimate." },
        }),
      );
    }
  };

  // Dummy PDF export (replace with real PDF logic)
  const handleExportPDF = () => {
    const pdfContent = `Estimate\nProduct: ${selectedProduct?.name}\nSqft: ${sqft}\nAccessories: ${selectedAccessories.map((a) => a.name).join(", ")}\nLine Items: ${lineItems.map((li) => `${li.name} x${li.qty} @$${li.price}`).join(", ")}\nTotal: $${total.toFixed(2)}`;
    const blob = new Blob([pdfContent], { type: "application/pdf" });
    setPdfUrl(URL.createObjectURL(blob));
  };

  // Real e-sign integration (DocuSign API placeholder)
  const handleESign = async () => {
    try {
      // Example: Call backend API to create DocuSign envelope
      const res = await fetch("/api/esign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: selectedProduct,
          sqft,
          accessories: selectedAccessories,
          lineItems,
          margin,
          commission,
          total,
        }),
      });
      if (!res.ok) throw new Error("Failed to send e-sign request");
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "success", message: "E-signature request sent!" },
        }),
      );
    } catch (e) {
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "error", message: "E-signature request failed." },
        }),
      );
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 border rounded">
      <h2 className="text-xl font-semibold mb-4">Estimate Builder</h2>
      {!workspaceId && (
        <div className="mb-3 p-3 rounded border border-amber-400 bg-amber-900/20 text-amber-100 text-sm">
          No workspace selected. Set localStorage.workspaceId to load catalog.
        </div>
      )}
      {loadingProducts ? (
        <div className="text-sm text-gray-500 mb-3">Loading catalog…</div>
      ) : products.length === 0 ? (
        <div className="text-sm text-gray-500 mb-3">
          No products found for this workspace.
        </div>
      ) : null}
      <div className="mb-2">
        <label className="block mb-1">Product</label>
        <select
          value={selectedProduct?.id || ""}
          onChange={(e) =>
            setSelectedProduct(
              products.find((p) => p.id === e.target.value) || null,
            )
          }
          className="border rounded px-2 py-1 w-full"
        >
          <option value="">Select product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (${p.price || p.pricePerSqft || 0}/sqft)
            </option>
          ))}
        </select>
      </div>
      <div className="mb-2">
        <label className="block mb-1">Square Feet</label>
        <input
          type="number"
          value={sqft}
          onChange={(e) => setSqft(Number(e.target.value))}
          className="border rounded px-2 py-1 w-full"
        />
      </div>
      <div className="mb-2">
        <label className="block mb-1">Waste (%)</label>
        <input
          type="number"
          value={wastePct}
          onChange={(e) => setWastePct(Number(e.target.value))}
          className="border rounded px-2 py-1 w-full"
        />
      </div>
      <div className="mb-2">
        <label className="block mb-1">Linear Ft (from takeoff)</label>
        <input
          type="number"
          value={linearFt}
          onChange={(e) => setLinearFt(Number(e.target.value))}
          className="border rounded px-2 py-1 w-full"
        />
      </div>
      {selectedProduct && (
        <div className="mb-2">
          <label className="block mb-1">Suggested Accessories</label>
          {/* Context-aware suggestions */}
          <div className="mb-1 text-xs text-muted">
            Suggestions:{" "}
            {getSuggestedAccessories().length > 0
              ? getSuggestedAccessories().join(", ")
              : "None"}
          </div>
          {loadingAccessories && (
            <div className="text-xs text-gray-500">Loading accessories…</div>
          )}
          {!loadingAccessories &&
            selectedProduct.accessories?.length > 0 &&
            selectedProduct.accessories.map((accName: string) => {
              const acc = accessories.find(
                (a) => a.name === accName || a.id === accName,
              );
              if (!acc) return null;
              const price = acc.price ?? acc.sellPrice ?? 0;
              return (
                <label key={acc.id} className="block">
                  <input
                    type="checkbox"
                    checked={selectedAccessories.some((a) => a.id === acc.id)}
                    onChange={() => handleAccessoryToggle({ ...acc, price })}
                  />{" "}
                  {acc.name} (${price}/{acc.unitType || "unit"})
                </label>
              );
            })}
          {/* Show context-aware accessories from line items */}
          {getSuggestedAccessories().map((accName) => {
            const acc = accessories.find(
              (a) => a.name === accName || a.id === accName,
            );
            if (!acc || selectedProduct.accessories?.includes(accName))
              return null;
            const price = acc.price ?? acc.sellPrice ?? 0;
            return (
              <label key={acc.id} className="block">
                <input
                  type="checkbox"
                  checked={selectedAccessories.some((a) => a.id === acc.id)}
                  onChange={() => handleAccessoryToggle({ ...acc, price })}
                />{" "}
                {acc.name} (${price}/{acc.unitType || "unit"})
              </label>
            );
          })}
        </div>
      )}
      {/* Advanced: editable line items */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="block font-medium">Line Items</span>
          <button
            onClick={addLineItem}
            className="px-2 py-1 bg-gray-200 rounded text-xs"
          >
            + Add
          </button>
        </div>
        {lineItems.map((li, idx) => (
          <div key={idx} className="flex gap-2 mb-1 items-center">
            <input
              value={li.name}
              onChange={(e) => updateLineItem(idx, "name", e.target.value)}
              placeholder="Name"
              className="border rounded px-2 py-1 flex-1"
            />
            <input
              type="number"
              value={li.qty}
              onChange={(e) => updateLineItem(idx, "qty", e.target.value)}
              placeholder="Qty"
              className="border rounded px-2 py-1 w-16"
            />
            <input
              type="number"
              value={li.price}
              onChange={(e) => updateLineItem(idx, "price", e.target.value)}
              placeholder="Price"
              className="border rounded px-2 py-1 w-20"
            />
            <button
              onClick={() => removeLineItem(idx)}
              className="text-red-600 text-xs"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="mb-2">
        <label className="block mb-1">Margin (%)</label>
        <input
          type="number"
          value={margin}
          onChange={(e) => setMargin(Number(e.target.value))}
          className="border rounded px-2 py-1 w-full"
        />
      </div>
      <div className="mb-2">
        <label className="block mb-1">Commission (%)</label>
        <input
          type="number"
          value={commission}
          onChange={(e) => setCommission(Number(e.target.value))}
          className="border rounded px-2 py-1 w-full"
        />
      </div>
      <div className="mb-4">
        <div>Subtotal: ${subtotal.toFixed(2)}</div>
        <div>Effective Sqft (with waste): {effectiveSqft.toFixed(2)}</div>
        <div>Margin: ${marginAmount.toFixed(2)}</div>
        <div>Commission: ${commissionAmount.toFixed(2)}</div>
        <div className="font-bold">Total: ${total.toFixed(2)}</div>
      </div>
      <div className="flex gap-2 mb-2">
        <button
          onClick={handleSaveEstimate}
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={saving || !selectedProduct || !sqft || !workspaceId}
        >
          Save Estimate
        </button>
        <button
          onClick={handleExportPDF}
          className="bg-gray-700 text-white px-4 py-2 rounded"
          disabled={!selectedProduct || !sqft}
        >
          Export PDF
        </button>
        <button
          onClick={handleESign}
          className="bg-green-700 text-white px-4 py-2 rounded"
          disabled={!selectedProduct || !sqft}
        >
          E-Sign
        </button>
      </div>
      {pdfUrl && (
        <div className="mt-2">
          <a
            href={pdfUrl}
            download="estimate.pdf"
            className="text-blue-600 underline"
          >
            Download PDF
          </a>
        </div>
      )}
      {/* Advanced: summary */}
      <div className="mt-4 p-2 border rounded bg-gray-50">
        <div className="font-bold mb-1">Summary</div>
        <div>Product: {selectedProduct?.name || "-"}</div>
        <div>Sqft: {sqft}</div>
        <div>
          Waste: {wastePct}% (effective {effectiveSqft.toFixed(2)} sqft)
        </div>
        <div>Linear Ft: {linearFt}</div>
        <div>
          Accessories:{" "}
          {selectedAccessories.map((a) => a.name).join(", ") || "-"}
        </div>
        <div>Line Items: {lineItems.length}</div>
      </div>
    </div>
  );
}
