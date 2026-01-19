"use client";
import React, { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Product } from "../lib/types";

interface ProductFormProps {
  onCreated: () => void;
}

const initialState: Omit<Product, "id" | "createdAt" | "updatedAt"> = {
  name: "",
  brand: "",
  line: "",
  color: "",
  sku: "",
  materialType: "LVP",
  unit: "sqft/carton",
  costPerSqft: 0,
  sellPricePerSqft: 0,
  stockStatus: "in-stock",
  specSheetUrl: "",
  images: [],
  accessories: [],
  wearLayer: "",
  warrantyNotes: "",
  waterproof: false,
  petFriendly: false,
};

export default function ProductForm({ onCreated }: ProductFormProps) {
  const [form, setForm] = useState(initialState);
  const [useTieredPricing, setUseTieredPricing] = useState(
    typeof initialState.sellPricePerSqft === 'object'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };


  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await addDoc(collection(db, "products"), {
        ...form,
        waterproof: Boolean(form.waterproof),
        petFriendly: Boolean(form.petFriendly),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      setForm(initialState);
      onCreated();
    } catch (err) {
      setError("Failed to create product");
    }
    setLoading(false);
  };

  // Handlers for tiered pricing
  const handleTierChange = (tier: string, value: number) => {
    setForm(prev => ({
      ...prev,
      sellPricePerSqft: {
        ...(typeof prev.sellPricePerSqft === 'object' ? prev.sellPricePerSqft : {}),
        [tier]: value
      }
    }));
  };

  const handleRemoveTier = (tier: string) => {
    if (typeof form.sellPricePerSqft !== 'object') return;
    const { [tier]: _, ...rest } = form.sellPricePerSqft;
    setForm(prev => ({ ...prev, sellPricePerSqft: rest }));
  };

  const handleAddTier = () => {
    const tier = prompt('Enter tier name (e.g., retail, wholesale):');
    if (!tier) return;
    setForm(prev => ({
      ...prev,
      sellPricePerSqft: {
        ...(typeof prev.sellPricePerSqft === 'object' ? prev.sellPricePerSqft : {}),
        [tier]: 0
      }
    }));
  };

  // Toggle between single and tiered pricing
  const handlePricingModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setUseTieredPricing(checked);
    setForm(prev => ({
      ...prev,
      sellPricePerSqft: checked ? {} : 0
    }));
  };

  return (
    <form className="bg-white p-4 rounded shadow mb-6" onSubmit={handleSubmit}>
      <div className="mb-2">
        <label className="block text-sm font-medium">Name</label>
        <input name="name" value={form.name} onChange={handleChange} className="border rounded px-2 py-1 w-full" required />
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium">Brand</label>
        <input name="brand" value={form.brand} onChange={handleChange} className="border rounded px-2 py-1 w-full" required />
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium">Line</label>
        <input name="line" value={form.line} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium">Color</label>
        <input name="color" value={form.color} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium">SKU</label>
        <input name="sku" value={form.sku} onChange={handleChange} className="border rounded px-2 py-1 w-full" required />
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium">Material Type</label>
        <select name="materialType" value={form.materialType} onChange={handleChange} className="border rounded px-2 py-1 w-full">
          <option value="LVP">LVP</option>
          <option value="Laminate">Laminate</option>
          <option value="Hardwood">Hardwood</option>
          <option value="Tile">Tile</option>
          <option value="Carpet">Carpet</option>
        </select>
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium">Unit</label>
        <input name="unit" value={form.unit} onChange={handleChange} className="border rounded px-2 py-1 w-full" placeholder="e.g. sqft/carton, plank size" />
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium">Cost per Sqft</label>
        <input name="costPerSqft" type="number" value={form.costPerSqft} onChange={handleNumberChange} className="border rounded px-2 py-1 w-full" required />
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium">Pricing Mode</label>
        <div className="flex items-center gap-4 mt-1">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={!useTieredPricing}
              onChange={() => handlePricingModeChange({ target: { checked: false } } as any)}
            />
            Single Price
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={useTieredPricing}
              onChange={() => handlePricingModeChange({ target: { checked: true } } as any)}
            />
            Tiered Pricing
          </label>
        </div>
      </div>
      {!useTieredPricing ? (
        <div className="mb-2">
          <label className="block text-sm font-medium">Sell Price per Sqft</label>
          <input
            name="sellPricePerSqft"
            type="number"
            value={typeof form.sellPricePerSqft === 'number' ? form.sellPricePerSqft : ''}
            onChange={handleNumberChange}
            className="border rounded px-2 py-1 w-full"
            required
          />
        </div>
      ) : (
        <div className="mb-2">
          <label className="block text-sm font-medium">Tiered Pricing (per Sqft)</label>
          <div className="space-y-2">
            {form.sellPricePerSqft && typeof form.sellPricePerSqft === 'object' &&
              Object.entries(form.sellPricePerSqft).map(([tier, value]) => (
                <div key={tier} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tier}
                    disabled
                    className="border rounded px-2 py-1 w-32 bg-gray-100"
                  />
                  <input
                    type="number"
                    value={value}
                    min={0}
                    step={0.01}
                    onChange={e => handleTierChange(tier, Number(e.target.value))}
                    className="border rounded px-2 py-1 w-32"
                  />
                  <button type="button" className="text-red-600" onClick={() => handleRemoveTier(tier)}>
                    Remove
                  </button>
                </div>
              ))}
            <button type="button" className="bg-blue-600 text-white px-2 py-1 rounded mt-2" onClick={handleAddTier}>
              Add Tier
            </button>
          </div>
        </div>
      )}
      <div className="mb-2">
        <label className="block text-sm font-medium">Stock Status</label>
        <select name="stockStatus" value={form.stockStatus} onChange={handleChange} className="border rounded px-2 py-1 w-full">
          <option value="in-stock">In Stock</option>
          <option value="out-of-stock">Out of Stock</option>
          <option value="limited">Limited</option>
        </select>
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium">Spec Sheet PDF URL</label>
        <input name="specSheetUrl" value={form.specSheetUrl} onChange={handleChange} className="border rounded px-2 py-1 w-full" placeholder="https://...pdf" />
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium">Wear Layer / Thickness</label>
        <input name="wearLayer" value={form.wearLayer} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium">Warranty Notes</label>
        <input name="warrantyNotes" value={form.warrantyNotes} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium">Accessories (comma separated)</label>
        <input name="accessories" value={(form.accessories || []).join(", ")} onChange={e => setForm(f => ({ ...f, accessories: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))} className="border rounded px-2 py-1 w-full" />
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium">Waterproof</label>
        <select name="waterproof" value={form.waterproof ? "yes" : "no"} onChange={e => setForm(f => ({ ...f, waterproof: e.target.value === "yes" }))} className="border rounded px-2 py-1 w-full">
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium">Pet Friendly</label>
        <select name="petFriendly" value={form.petFriendly ? "yes" : "no"} onChange={e => setForm(f => ({ ...f, petFriendly: e.target.value === "yes" }))} className="border rounded px-2 py-1 w-full">
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </div>
      {/* Image upload can be added later */}
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
        {loading ? "Creating..." : "Create Product"}
      </button>
    </form>
  );
}
