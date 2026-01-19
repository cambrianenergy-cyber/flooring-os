import React from "react";

export interface ProductFiltersProps {
  filters: {
    color: string[];
    thickness: string[];
    wearLayer: string[];
    waterproof: boolean | null;
    priceTier: string[];
    inStock: boolean | null;
    petFriendly: boolean | null;
  };
  setFilters: (filters: ProductFiltersProps["filters"]) => void;
  availableOptions: {
    color: string[];
    thickness: string[];
    wearLayer: string[];
    priceTier: string[];
  };
}

export default function ProductFilters({ filters, setFilters, availableOptions }: ProductFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-6 items-end">
      <div>
        <label className="block text-xs font-semibold mb-1">Color</label>
        <select
          className="border rounded px-2 py-1"
          value={filters.color[0] || ""}
          onChange={e => setFilters({ ...filters, color: e.target.value ? [e.target.value] : [] })}
        >
          <option value="">All</option>
          {availableOptions.color.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Thickness</label>
        <select
          className="border rounded px-2 py-1"
          value={filters.thickness[0] || ""}
          onChange={e => setFilters({ ...filters, thickness: e.target.value ? [e.target.value] : [] })}
        >
          <option value="">All</option>
          {availableOptions.thickness.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Wear Layer</label>
        <select
          className="border rounded px-2 py-1"
          value={filters.wearLayer[0] || ""}
          onChange={e => setFilters({ ...filters, wearLayer: e.target.value ? [e.target.value] : [] })}
        >
          <option value="">All</option>
          {availableOptions.wearLayer.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Waterproof</label>
        <select
          className="border rounded px-2 py-1"
          value={filters.waterproof === null ? "" : filters.waterproof ? "yes" : "no"}
          onChange={e => setFilters({ ...filters, waterproof: e.target.value === "" ? null : e.target.value === "yes" })}
        >
          <option value="">All</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Price Tier</label>
        <select
          className="border rounded px-2 py-1"
          value={filters.priceTier[0] || ""}
          onChange={e => setFilters({ ...filters, priceTier: e.target.value ? [e.target.value] : [] })}
        >
          <option value="">All</option>
          {availableOptions.priceTier.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">In Stock</label>
        <select
          className="border rounded px-2 py-1"
          value={filters.inStock === null ? "" : filters.inStock ? "yes" : "no"}
          onChange={e => setFilters({ ...filters, inStock: e.target.value === "" ? null : e.target.value === "yes" })}
        >
          <option value="">All</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Pet Friendly</label>
        <select
          className="border rounded px-2 py-1"
          value={filters.petFriendly === null ? "" : filters.petFriendly ? "yes" : "no"}
          onChange={e => setFilters({ ...filters, petFriendly: e.target.value === "" ? null : e.target.value === "yes" })}
        >
          <option value="">All</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>
    </div>
  );
}
