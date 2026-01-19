"use client";
import React, { useState } from "react";
import type { Product } from "../lib/types";

interface ProductGalleryProps {
  product: Product;
  onClose: () => void;
}

export default function ProductGallery({ product, onClose }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const images = product.images || [];

  const prevImage = () => setActiveIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const nextImage = () => setActiveIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  if (images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-white rounded-lg shadow-lg p-4 max-w-md w-full relative">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-black" onClick={onClose}>&times;</button>
        <div className="flex items-center justify-center mb-4">
          <button onClick={prevImage} className="px-2 text-2xl">&#8592;</button>
          <img src={images[activeIndex]} alt={product.name} className="w-64 h-64 object-contain mx-2 rounded" />
          <button onClick={nextImage} className="px-2 text-2xl">&#8594;</button>
        </div>
        <div className="flex justify-center gap-1 mb-2">
          {images.map((_, idx) => (
            <button
              key={idx}
              className={`w-2 h-2 rounded-full ${idx === activeIndex ? "bg-blue-600" : "bg-gray-300"}`}
              onClick={() => setActiveIndex(idx)}
            />
          ))}
        </div>
        <div className="text-center space-y-1">
          <div className="font-semibold text-lg">{product.name}</div>
          <div className="text-gray-500 text-sm">{product.brand}{product.line ? ` • ${product.line}` : ''}</div>
          <div className="text-gray-700 text-sm">SKU: {product.sku}</div>
          {product.color && <div className="text-gray-700 text-sm">Color: {product.color}</div>}
          <div className="text-gray-700 text-sm">Unit: {product.unit}</div>
          {product.wearLayer && <div className="text-gray-700 text-sm">Wear Layer / Thickness: {product.wearLayer}</div>}
          <div className="text-gray-700 text-sm">Cost: ${product.costPerSqft?.toFixed(2)}/sqft</div>
          <div className="text-gray-700 text-sm">Sell: {typeof product.sellPricePerSqft === 'object' ? Object.entries(product.sellPricePerSqft).map(([tier, price]) => (<span key={tier}>{tier}: ${price.toFixed(2)} </span>)) : <>${product.sellPricePerSqft?.toFixed(2)}/sqft</>}</div>
          {product.stockStatus && <div className="text-gray-700 text-sm">Stock: {product.stockStatus}</div>}
          {product.waterproof !== undefined && <div className="text-gray-700 text-sm">Waterproof: {product.waterproof ? 'Yes' : 'No'}</div>}
          {product.petFriendly !== undefined && <div className="text-gray-700 text-sm">Pet Friendly: {product.petFriendly ? 'Yes' : 'No'}</div>}
          {product.warrantyNotes && <div className="text-gray-700 text-sm">Warranty: {product.warrantyNotes}</div>}
          {product.specSheetUrl && <div className="text-blue-700 text-sm"><a href={product.specSheetUrl} target="_blank" rel="noopener noreferrer">Spec Sheet (PDF)</a></div>}
          {product.accessories && product.accessories.length > 0 && (
            <div className="text-gray-700 text-sm">Accessories: {product.accessories.join(", ")}</div>
          )}
        </div>
      </div>
    </div>
  );
}
