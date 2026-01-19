// QuoteBuilder.tsx
// Step-by-step quote builder for rooms, products, labor, accessories, taxes, discounts

"use client";
import React, { useState } from "react";

export interface QuoteRoom {
  id: string;
  name: string;
  sqft: number;
  productId: string;
  productName: string;
  productPrice: number;
}

export interface QuoteAccessory {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface QuoteData {
  rooms: QuoteRoom[];
  labor: number;
  accessories: QuoteAccessory[];
  taxRate: number;
  discount: number;
  discountApproved: boolean;
  subtotal: number;
  tax: number;
  total: number;
}

export default function QuoteBuilder({
  availableRooms,
  availableProducts,
  availableAccessories,
  onSubmit,
}: {
  availableRooms: { id: string; name: string; sqft: number }[];
  availableProducts: { id: string; name: string; price: number }[];
  availableAccessories: { id: string; name: string; price: number }[];
  onSubmit: (data: QuoteData) => void;
}) {
  const [selectedRooms, setSelectedRooms] = useState<QuoteRoom[]>([]);
  const [labor, setLabor] = useState(0);
  const [accessories, setAccessories] = useState<QuoteAccessory[]>([]);
  const [taxRate, setTaxRate] = useState(8.5);
  const [discount, setDiscount] = useState(0);
  const [discountApproved, setDiscountApproved] = useState(false);

  // Step 1: Pick rooms and assign products
  function handleRoomSelect(roomId: string, productId: string) {
    const room = availableRooms.find(r => r.id === roomId);
    const product = availableProducts.find(p => p.id === productId);
    if (!room || !product) return;
    setSelectedRooms(prev => {
      const filtered = prev.filter(r => r.id !== roomId);
      return [
        ...filtered,
        {
          id: room.id,
          name: room.name,
          sqft: room.sqft,
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
        },
      ];
    });
  }

  // Step 2: Add accessories
  function handleAccessoryChange(id: string, quantity: number) {
    const accessory = availableAccessories.find(a => a.id === id);
    if (!accessory) return;
    setAccessories(prev => {
      const filtered = prev.filter(a => a.id !== id);
      return [
        ...filtered,
        { id, name: accessory.name, price: accessory.price, quantity },
      ];
    });
  }

  // Step 3: Calculate totals
  const subtotal = selectedRooms.reduce((sum, r) => sum + r.sqft * r.productPrice, 0)
    + labor
    + accessories.reduce((sum, a) => sum + a.price * a.quantity, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax - (discountApproved ? discount : 0);

  function handleSubmit() {
    onSubmit({
      rooms: selectedRooms,
      labor,
      accessories,
      taxRate,
      discount,
      discountApproved,
      subtotal,
      tax,
      total,
    });
  }

  return (
    <div className="border rounded p-4 max-w-2xl mx-auto mt-4">
      <h2 className="text-xl font-semibold mb-4">Quote Builder</h2>
      <div className="mb-4">
        <h3 className="font-medium mb-2">1. Pick Rooms & Products</h3>
        {availableRooms.map(room => (
          <div key={room.id} className="mb-2 flex items-center gap-2">
            <span className="w-32">{room.name} ({room.sqft} sqft)</span>
            <select
              onChange={e => handleRoomSelect(room.id, e.target.value)}
              value={selectedRooms.find(r => r.id === room.id)?.productId || ""}
              className="border rounded px-2 py-1"
            >
              <option value="">Select Product</option>
              {availableProducts.map(p => (
                <option key={p.id} value={p.id}>{p.name} (${p.price}/sqft)</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div className="mb-4">
        <h3 className="font-medium mb-2">2. Labor</h3>
        <input
          type="number"
          value={labor}
          onChange={e => setLabor(Number(e.target.value))}
          className="border rounded px-2 py-1"
          min={0}
        />
      </div>
      <div className="mb-4">
        <h3 className="font-medium mb-2">3. Accessories</h3>
        {availableAccessories.map(a => (
          <div key={a.id} className="mb-2 flex items-center gap-2">
            <span className="w-32">{a.name}</span>
            <input
              type="number"
              min={0}
              value={accessories.find(acc => acc.id === a.id)?.quantity || 0}
              onChange={e => handleAccessoryChange(a.id, Number(e.target.value))}
              className="border rounded px-2 py-1 w-20"
            />
            <span>${a.price} each</span>
          </div>
        ))}
      </div>
      <div className="mb-4">
        <h3 className="font-medium mb-2">4. Taxes</h3>
        <input
          type="number"
          value={taxRate}
          onChange={e => setTaxRate(Number(e.target.value))}
          className="border rounded px-2 py-1 w-20"
          min={0}
          max={20}
        />
        <span className="ml-2">%</span>
      </div>
      <div className="mb-4">
        <h3 className="font-medium mb-2">5. Discounts</h3>
        <input
          type="number"
          value={discount}
          onChange={e => setDiscount(Number(e.target.value))}
          className="border rounded px-2 py-1 w-20"
          min={0}
        />
        <label className="ml-2">
          <input
            type="checkbox"
            checked={discountApproved}
            onChange={e => setDiscountApproved(e.target.checked)}
            className="mr-1"
          />
          Approved
        </label>
      </div>
      <div className="mb-4 border-t pt-4">
        <div>Subtotal: <b>${subtotal.toFixed(2)}</b></div>
        <div>Tax: <b>${tax.toFixed(2)}</b></div>
        <div>Total: <b>${total.toFixed(2)}</b></div>
      </div>
      <button
        className="px-4 py-2 bg-blue-700 text-white rounded"
        onClick={handleSubmit}
      >
        Generate Proposal
      </button>
    </div>
  );
}
