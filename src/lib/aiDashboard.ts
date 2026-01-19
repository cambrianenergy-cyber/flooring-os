// src/lib/aiDashboard.ts
// Firestore queries and backend logic for Owner dashboard value/limits tiles
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
} from "firebase/firestore";

// --- Configurable minutes saved per feature (can be moved to Firestore/config)
export const FEATURE_MINUTES_SAVED: Record<string, number> = {
  estimate_assist: 6,
  scope_builder: 10,
  followup_draft: 4,
  // ...add more features as needed
};

// --- 1. AI Actions Completed (MTD) ---
export async function getAIActionsCompletedMTD(workspaceId: string) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const q = query(
    collection(db, `workspaces/${workspaceId}/ai_events`),
    where("monthKey", "==", monthKey)
  );
  const snap = await getDocs(q);
  const featureCounts: Record<string, number> = {};
  snap.forEach(doc => {
    const { featureKey } = doc.data();
    featureCounts[featureKey] = (featureCounts[featureKey] || 0) + 1;
  });
  return featureCounts;
}

// --- 2. Hours Saved (MTD, estimated) ---
export async function getEstimatedHoursSavedMTD(workspaceId: string) {
  const featureCounts = await getAIActionsCompletedMTD(workspaceId);
  let totalMinutes = 0;
  for (const [feature, count] of Object.entries(featureCounts)) {
    const minPer = FEATURE_MINUTES_SAVED[feature] || 0;
    totalMinutes += minPer * count;
  }
  return totalMinutes / 60;
}

// --- 3. Revenue Influenced (MTD, optional) ---
export async function getRevenueInfluencedMTD(workspaceId: string, percent = 0.05) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const q = query(
    collection(db, `workspaces/${workspaceId}/ai_events`),
    where("monthKey", "==", monthKey),
    where("estimateId", ">", "") // Only events tied to an estimate
  );
  const snap = await getDocs(q);
  let revenue = 0;
  for (const docSnap of snap.docs) {
    const { estimateId } = docSnap.data();
    if (estimateId) {
      // Fetch estimate total
      const estRef = collection(db, `workspaces/${workspaceId}/estimates`);
      const estSnap = await getDocs(query(estRef, where("id", "==", estimateId)));
      estSnap.forEach(e => {
        const estData = e.data();
        if (typeof estData.total === "number") {
          revenue += estData.total * percent;
        }
      });
    }
  }
  return revenue;
}

// --- 4. Win Lift (MTD, optional) ---
export async function getWinLiftMTD(workspaceId: string) {
  // Get all estimates for this month
  const now = new Date();
  const monthStart = Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const estRef = collection(db, `workspaces/${workspaceId}/estimates`);
  const estSnap = await getDocs(query(estRef, where("createdAt", ">=", monthStart)));
  let aiUsed = 0, aiWon = 0, noAi = 0, noAiWon = 0;
  for (const est of estSnap.docs) {
    const estData = est.data();
    const aiQ = query(
      collection(db, `workspaces/${workspaceId}/ai_events`),
      where("estimateId", "==", est.id)
    );
    const aiSnap = await getDocs(aiQ);
    const won = estData.status === "won";
    if (!aiSnap.empty) {
      aiUsed++;
      if (won) aiWon++;
    } else {
      noAi++;
      if (won) noAiWon++;
    }
  }
  const aiRate = aiUsed ? aiWon / aiUsed : 0;
  const noAiRate = noAi ? noAiWon / noAi : 0;
  return { aiRate, noAiRate, winLift: aiRate - noAiRate };
}

// --- 5. Tokens Used / Cap (MTD) ---
export async function getTokensUsedMTD(workspaceId: string, cap: number) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const q = query(
    collection(db, `workspaces/${workspaceId}/ai_events`),
    where("monthKey", "==", monthKey)
  );
  const snap = await getDocs(q);
  let used = 0;
  snap.forEach(doc => {
    used += doc.data().tokensIn || 0;
  });
  return { used, cap, percent: cap ? used / cap : 0 };
}

// --- 6. Top User / Top Feature Usage (MTD) ---
export async function getTopUserAndFeatureMTD(workspaceId: string) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const q = query(
    collection(db, `workspaces/${workspaceId}/ai_events`),
    where("monthKey", "==", monthKey)
  );
  const snap = await getDocs(q);
  const userCounts: Record<string, number> = {};
  const featureCounts: Record<string, number> = {};
  snap.forEach(doc => {
    const { uid, featureKey } = doc.data();
    userCounts[uid] = (userCounts[uid] || 0) + 1;
    featureCounts[featureKey] = (featureCounts[featureKey] || 0) + 1;
  });
  const topUser = Object.entries(userCounts).sort((a, b) => b[1] - a[1])[0];
  const topFeature = Object.entries(featureCounts).sort((a, b) => b[1] - a[1])[0];
  return {
    topUser: topUser ? { uid: topUser[0], count: topUser[1] } : null,
    topFeature: topFeature ? { featureKey: topFeature[0], count: topFeature[1] } : null,
  };
}

// --- 7. Next Reset Date + Projected Exhaustion Date ---
export function getNextResetDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

// --- 7. Projected Exhaustion Date ---
export async function getProjectedExhaustionDate(workspaceId: string, cap: number) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const q = query(
    collection(db, `workspaces/${workspaceId}/ai_events`),
    where("monthKey", "==", monthKey),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  let used = 0;
  let firstDate: Date | null = null;
  let lastDate: Date | null = null;
  snap.forEach(doc => {
    used += doc.data().tokensIn || 0;
    const createdAt: Date | null = doc.data().createdAt?.toDate?.() || null;
    if (createdAt instanceof Date) {
      if (!firstDate) firstDate = createdAt;
      lastDate = createdAt;
    }
  });
  if (!firstDate || !lastDate || used === 0) return null;
  // Type assertion to Date since we only assign Date or null
  const first = firstDate as Date;
  const last = lastDate as Date;
  const days = (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24) || 1;
  const daily = used / days;
  const remaining = cap - used;
  const projectedDays = daily > 0 ? remaining / daily : null;
  return projectedDays ? new Date(last.getTime() + projectedDays * 24 * 60 * 60 * 1000) : null;
}
