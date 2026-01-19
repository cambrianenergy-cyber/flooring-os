import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function fetchTenantLogoUrl(tenantId: string): Promise<string | null> {
  try {
    const ref = doc(db, "tenants", tenantId, "settings", "branding");
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      return data.logoUrl || null;
    }
    return null;
  } catch {
    return null;
  }
}
