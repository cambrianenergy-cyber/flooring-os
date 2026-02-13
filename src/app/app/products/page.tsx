"use client";
import {
    arrayUnion,
    collection,
    doc,
    onSnapshot,
    query,
    updateDoc,
    where,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProductFilters from "../../../components/ProductFilters";
import ProductForm from "../../../components/ProductForm";
import ProductGallery from "../../../components/ProductGallery";
import ProductPhotoUpload from "../../../components/ProductPhotoUpload";
import ProductTabs from "../../../components/ProductTabs";
import UploadProductButton from "../../../components/UploadProductButton";
import { db } from "../../../lib/firebase";
import type { Product } from "../../../lib/types";

export default function ProductsPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("Carpet");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [filters, setFilters] = useState<{
    color: string[];
    thickness: string[];
    wearLayer: string[];
    waterproof: boolean | null;
    priceTier: string[];
    inStock: boolean | null;
    petFriendly: boolean | null;
  }>({
    color: [],
    thickness: [],
    wearLayer: [],
    waterproof: null,
    priceTier: [],
    inStock: null,
    petFriendly: null,
  });
  const [availableOptions, setAvailableOptions] = useState<{
    color: string[];
    thickness: string[];
    wearLayer: string[];
    priceTier: string[];
  }>({
    color: [],
    thickness: [],
    wearLayer: [],
    priceTier: [],
  });

  useEffect(() => {
    const q = query(
      collection(db, "products"),
      where("materialType", "==", activeTab),
    );
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setProducts(docs);
      // Extract available filter options from products
      setAvailableOptions({
        color: Array.from(new Set(docs.map((p) => p.color).filter(Boolean))),
        thickness: Array.from(
          new Set(docs.map((p) => p.wearLayer).filter(Boolean)),
        ),
        wearLayer: Array.from(
          new Set(docs.map((p) => p.wearLayer).filter(Boolean)),
        ),
        priceTier: Array.from(
          new Set(
            docs.flatMap((p) =>
              typeof p.sellPricePerSqft === "object"
                ? Object.keys(p.sellPricePerSqft)
                : [],
            ),
          ),
        ),
      });
    });
    return () => unsub();
  }, [activeTab]);

  const handlePhotoUpload = async (file: File) => {
    if (!selectedProduct) return;
    // TODO: Upload to Firebase Storage and get URL
    // For now, just fake a URL
    const fakeUrl = URL.createObjectURL(file);
    await updateDoc(doc(db, "products", selectedProduct.id!), {
      images: arrayUnion(fakeUrl),
    });
  };

  // Filtering logic
  const filteredProducts = products.filter((product) => {
    if (filters.color.length && product.color !== filters.color[0])
      return false;
    if (filters.thickness.length && product.wearLayer !== filters.thickness[0])
      return false;
    if (filters.wearLayer.length && product.wearLayer !== filters.wearLayer[0])
      return false;
    if (
      filters.waterproof !== null &&
      product.waterproof !== filters.waterproof
    )
      return false;
    if (
      filters.priceTier.length &&
      typeof product.sellPricePerSqft === "object" &&
      !Object.keys(product.sellPricePerSqft).includes(filters.priceTier[0])
    )
      return false;
    if (
      filters.inStock !== null &&
      ((filters.inStock && product.stockStatus !== "in-stock") ||
        (!filters.inStock && product.stockStatus === "in-stock"))
    )
      return false;
    if (
      filters.petFriendly !== null &&
      product.petFriendly !== filters.petFriendly
    )
      return false;
    return true;
  });

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="mb-4 text-blue-600 underline"
      >
        Back
      </button>
      <h1 className="text-2xl font-semibold">Products</h1>
      <ProductTabs active={activeTab} onSelect={setActiveTab} />
      <ProductFilters
        filters={filters}
        setFilters={setFilters}
        availableOptions={availableOptions}
      />
      <UploadProductButton
        onUpload={(file) => {
          /* TODO: handle upload logic */
        }}
      />
      <button
        className="mb-6 bg-blue-600 text-white px-4 py-2 rounded"
        onClick={() => setShowForm((v) => !v)}
      >
        {showForm ? "Hide Product Form" : "Create Product"}
      </button>
      {showForm && (
        <div className="mb-6">
          <ProductForm onCreated={() => setShowForm(false)} />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="border rounded-lg p-4 bg-background text-slate-900 shadow hover:shadow-lg cursor-pointer transition"
            onClick={() => {
              setSelectedProduct(product);
              setGalleryOpen(true);
            }}
          >
            <div className="font-semibold text-lg mb-1">{product.name}</div>
            <div className="text-muted text-sm mb-2">{product.brand}</div>
            <div className="text-xs text-gray-600">SKU: {product.sku}</div>
            <div className="text-xs text-gray-600">
              Type: {product.materialType}
            </div>
            {product.images && product.images.length > 0 && (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-32 object-cover rounded mt-2"
              />
            )}
          </div>
        ))}
      </div>
      {galleryOpen && selectedProduct && (
        <>
          <ProductGallery
            product={selectedProduct}
            onClose={() => setGalleryOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
            <div className="pointer-events-auto">
              <ProductPhotoUpload onUpload={handlePhotoUpload} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
