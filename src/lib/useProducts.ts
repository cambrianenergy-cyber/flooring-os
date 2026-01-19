// useProducts.ts
// React hook for real-time Firestore product data

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, QuerySnapshot, DocumentData } from "firebase/firestore";

export interface Product {
  id: string;
  name: string;
  price: number;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "products"),
      (snap: QuerySnapshot<DocumentData>) => {
        setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return { products, loading };
}
