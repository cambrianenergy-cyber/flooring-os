import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useIsFounder(email: string | null | undefined) {
  const [isFounder, setIsFounder] = useState(false);
  useEffect(() => {
    if (!email) return;
    // You can use a founders collection, or check a field on the user/workspace doc
    // Here, we check a founders collection for simplicity
    const checkFounder = async () => {
      const ref = doc(db, "founders", email);
      const snap = await getDoc(ref);
      setIsFounder(snap.exists());
    };
    checkFounder();
  }, [email]);
  return isFounder;
}
