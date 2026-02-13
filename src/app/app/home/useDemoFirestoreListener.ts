import { useEffect } from "react";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";

export function useDemoFirestoreListener() {
  useEffect(() => {
    const db = getFirestore();
    const demoRef = collection(db, "demo");
    console.log("Demo listener path:", demoRef.path);
    const unsubscribe = onSnapshot(demoRef, (snapshot) => {
      // handle snapshot changes
      console.log("Demo collection updated", snapshot.docs.map(doc => doc.data()));
    });
    return () => unsubscribe();
  }, []);
}
