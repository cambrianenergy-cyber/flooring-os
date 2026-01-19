"use client";
import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import type { Product } from "../../lib/types";
import ProductGallery from "../../components/ProductGallery";
import ProductForm from "../../components/ProductForm";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { isFounder } from "../../lib/auth-utils";

export const PRODUCT_CATEGORIES = [
  "Carpet",
  "Laminate",
  "Tile",
  "LVP",
  "Hardwood",
  "Engineered Wood",
] as const;

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState<(typeof PRODUCT_CATEGORIES)[number]>(PRODUCT_CATEGORIES[0]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isFounderUser, setIsFounderUser] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsFounderUser(!!user && isFounder(user.email));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const q = query(
          collection(db, "products"),
          where("category", "==", activeTab)
        );
        const querySnapshot = await getDocs(q);
        const productsData: Product[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        setProducts(productsData);
      } catch (error) {
        setProducts([]);
      }
      setLoading(false);
    }
    fetchProducts();
  }, [activeTab]);

  return (
    <div className="products-page text-foreground min-h-screen">
      {isFounderUser && (
        <ProductForm onCreated={() => setActiveTab(activeTab)} />
      )}
      <div className="tabs flex gap-2 mb-4">
        {PRODUCT_CATEGORIES.map((category) => (
          <button
            key={category}
            className={`px-4 py-2 rounded ${
              activeTab === category
                ? "bg-accent text-background font-medium"
                : "bg-dark-muted text-foreground hover:bg-dark-muted/80"
            }`}
            onClick={() => setActiveTab(category)}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="tab-content">
        <h2 className="text-xl font-semibold mb-2 text-foreground">{activeTab} Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full text-center text-muted">Loading...</div>
          ) : products.length === 0 ? (
            <div className="col-span-full text-center text-muted">No products yet.</div>
          ) : (
            products.map((product) => (
              <button
                key={product.id}
                className="bg-dark-muted rounded shadow p-3 flex flex-col items-center focus:outline-none hover:bg-dark-muted/80 text-foreground"
                onClick={() => setSelectedProduct(product)}
              >
                {product.images && product.images.length > 0 ? (
                  <img src={product.images[0]} alt={product.name} className="w-24 h-24 object-cover mb-2 rounded" />
                ) : (
                  <div className="w-24 h-24 bg-dark-surface flex items-center justify-center mb-2 rounded text-muted">No Image</div>
                )}
                <div className="font-semibold text-foreground">{product.name}</div>
                <div className="text-sm text-muted">{product.brand} {product.line && <>- {product.line}</>} {product.color && <>- {product.color}</>}</div>
                <div className="text-xs text-muted/70">SKU: {product.sku}</div>
                <div className="text-xs text-muted/70">Type: {product.materialType}</div>
                <div className="text-xs text-muted/70">Unit: {product.unit}</div>
                <div className="text-xs text-muted/70">Cost: ${product.costPerSqft?.toFixed(2)}/sqft</div>
                <div className="text-xs text-muted/70">Sell: {typeof product.sellPricePerSqft === 'object' ? Object.entries(product.sellPricePerSqft).map(([tier, price]) => (<span key={tier}>{tier}: ${price.toFixed(2)} </span>)) : <>${product.sellPricePerSqft?.toFixed(2)}/sqft</>}</div>
                {product.stockStatus && <div className="text-xs text-muted/70">Stock: {product.stockStatus}</div>}
                {product.specSheetUrl && <a href={product.specSheetUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent underline">Spec Sheet</a>}
              </button>
            ))
          )}
        </div>
        {selectedProduct && (
          <ProductGallery product={selectedProduct} onClose={() => setSelectedProduct(null)} />
        )}
      </div>
    </div>
  );
}
