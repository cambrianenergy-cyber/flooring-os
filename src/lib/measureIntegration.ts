/**
 * Square Measure™ Integration Helpers
 * 
 * Connects measurement collections with main app collections
 * (jobs, rooms, estimates, proposals)
 */

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { MEASURE_COLLECTIONS, type MeasureGeometry } from "@/types/measureSchema";

const db = getFirestore();

// ============================================================================
// Integration Points
// ============================================================================

/**
 * Key Joins:
 * 
 * jobs/{jobId} ↔ measure_sessions, measure_geometries, measure_photos, measure_roll_plans
 * rooms/{roomId} ↔ measure_geometries (1:1 recommended)
 * estimates ← measure_geometries.calculations.area + material_rules
 */

// ============================================================================
// Get all geometries for a job
// ============================================================================

export async function getJobGeometries(jobId: string) {
  const geometriesRef = collection(db, MEASURE_COLLECTIONS.GEOMETRIES);
  const q = query(
    geometriesRef,
    where("jobId", "==", jobId),
    orderBy("updatedAt", "desc")
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as (MeasureGeometry & { id: string })[];
}

// ============================================================================
// Get geometry for a specific room (1:1 relationship)
// ============================================================================

export async function getRoomGeometry(roomId: string) {
  // Option 1: If using roomId as doc ID
  const geometryRef = doc(db, MEASURE_COLLECTIONS.GEOMETRIES, roomId);
  const geometrySnap = await getDoc(geometryRef);
  
  if (geometrySnap.exists()) {
    return {
      id: geometrySnap.id,
      ...geometrySnap.data()
    } as MeasureGeometry & { id: string };
  }
  
  // Option 2: If using auto-generated IDs, query by roomId field
  const geometriesRef = collection(db, MEASURE_COLLECTIONS.GEOMETRIES);
  const q = query(
    geometriesRef,
    where("roomId", "==", roomId)
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  
  const firstDoc = snapshot.docs[0];
  return {
    id: firstDoc.id,
    ...firstDoc.data()
  } as MeasureGeometry & { id: string };
}

// ============================================================================
// Get total measured area for a job (sum all room geometries)
// ============================================================================

export async function getJobTotalArea(jobId: string) {
  const geometries = await getJobGeometries(jobId);
  
  const totalArea = geometries.reduce((sum, geom) => {
    return sum + (geom.calculations?.area || 0);
  }, 0);
  
  // Convert from canonical unit (inches²) to sq ft
  const totalSqFt = totalArea / 144;
  
  return {
    totalArea, // canonical (sq inches)
    totalSqFt, // display
    roomCount: geometries.length,
    geometries: geometries.map(g => ({
      roomId: g.roomId,
      area: g.calculations?.area || 0,
      status: g.status,
    }))
  };
}

// ============================================================================
// Get measurement sessions for a job
// ============================================================================

export async function getJobSessions(jobId: string) {
  const sessionsRef = collection(db, MEASURE_COLLECTIONS.SESSIONS);
  const q = query(
    sessionsRef,
    where("jobId", "==", jobId),
    orderBy("startedAt", "desc")
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// ============================================================================
// Get photos for a job or room
// ============================================================================

export async function getJobPhotos(jobId: string, roomId?: string) {
  const photosRef = collection(db, MEASURE_COLLECTIONS.PHOTOS);
  
  const constraints = [
    where("jobId", "==", jobId),
    orderBy("createdAt", "desc")
  ];
  
  if (roomId) {
    constraints.splice(1, 0, where("roomId", "==", roomId));
  }
  
  const q = query(photosRef, ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// ============================================================================
// Calculate estimate line item from geometry + material rules
// ============================================================================

export interface EstimateCalculation {
  roomId: string;
  roomName?: string;
  area: number; // sq inches canonical
  areaSqFt: number; // display
  wastePct: number;
  wasteArea: number;
  totalArea: number;
  totalSqFt: number;
  boxes?: number;
  lfBaseboard?: number;
}

export async function calculateEstimateFromGeometry(
  roomId: string,
  materialRuleId?: string
): Promise<EstimateCalculation | null> {
  // Get room geometry
  const geometry = await getRoomGeometry(roomId);
  if (!geometry) return null;
  
  // Get material rules (default to 10% waste if no rules)
  let wastePct = 10;
  let boxesPerSqFt: number | undefined;
  
  if (materialRuleId) {
    const ruleRef = doc(db, MEASURE_COLLECTIONS.MATERIAL_RULES, materialRuleId);
    const ruleSnap = await getDoc(ruleRef);
    
    if (ruleSnap.exists()) {
      const rule = ruleSnap.data();
      wastePct = rule.rules?.defaultWastePct || wastePct;
      
      if (rule.rules?.boxConversion?.sqFtPerBox) {
        boxesPerSqFt = rule.rules.boxConversion.sqFtPerBox;
      }
    }
  }
  
  const area = geometry.calculations?.area || 0;
  const areaSqFt = area / 144;
  const wasteArea = area * (wastePct / 100);
  const totalArea = area + wasteArea;
  const totalSqFt = totalArea / 144;
  
  const result: EstimateCalculation = {
    roomId,
    area,
    areaSqFt,
    wastePct,
    wasteArea,
    totalArea,
    totalSqFt,
  };
  
  // Calculate boxes if rule has conversion
  if (boxesPerSqFt) {
    result.boxes = Math.ceil(totalSqFt / boxesPerSqFt);
  }
  
  // Include baseboard linear feet if calculated
  if (geometry.calculations?.baseboardLf) {
    result.lfBaseboard = geometry.calculations.baseboardLf;
  }
  
  return result;
}

// ============================================================================
// Create estimate line items from all job geometries
// ============================================================================

export async function createEstimateLineItemsFromJob(
  jobId: string,
  materialRuleId?: string
) {
  const geometries = await getJobGeometries(jobId);
  
  const lineItems = await Promise.all(
    geometries.map(async (geom) => {
      const calc = await calculateEstimateFromGeometry(geom.roomId, materialRuleId);
      return calc;
    })
  );
  
  return lineItems.filter(Boolean) as EstimateCalculation[];
}

// ============================================================================
// Integration with existing estimate_line_items collection
// ============================================================================

export interface EstimateLineItemInput {
  estimateId: string;
  roomId: string;
  productId: string;
  description: string;
  quantity: number; // total sq ft or boxes
  unit: "sqft" | "box" | "lf";
  unitPrice: number;
  total: number;
  metadata?: {
    geometryId?: string;
    measuredArea?: number;
    wastePct?: number;
    calculatedAt?: Timestamp;
  };
}

/**
 * Example: Create estimate line item from measured geometry
 */
export async function createEstimateLineItemFromGeometry(
  estimateId: string,
  roomId: string,
  productId: string,
  productName: string,
  unitPrice: number,
  materialRuleId?: string
): Promise<EstimateLineItemInput | null> {
  const calc = await calculateEstimateFromGeometry(roomId, materialRuleId);
  if (!calc) return null;
  
  const quantity = calc.boxes || calc.totalSqFt;
  const unit = calc.boxes ? "box" : "sqft";
  
  return {
    estimateId,
    roomId,
    productId,
    description: `${productName} - Room`,
    quantity,
    unit,
    unitPrice,
    total: quantity * unitPrice,
    metadata: {
      geometryId: roomId,
      measuredArea: calc.areaSqFt,
      wastePct: calc.wastePct,
      calculatedAt: Timestamp.now(),
    }
  };
}

// ============================================================================
// Get audit trail for a job's measurements
// ============================================================================

export async function getJobMeasurementAudit(jobId: string) {
  const auditRef = collection(db, MEASURE_COLLECTIONS.AUDIT_LOGS);
  const q = query(
    auditRef,
    where("jobId", "==", jobId),
    orderBy("createdAt", "desc")
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// ============================================================================
// Get roll plans for carpet jobs
// ============================================================================

export async function getJobRollPlans(jobId: string) {
  const rollPlansRef = collection(db, MEASURE_COLLECTIONS.ROLL_PLANS);
  const q = query(
    rollPlansRef,
    where("jobId", "==", jobId),
    orderBy("updatedAt", "desc")
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// ============================================================================
// Summary: Get complete measurement data for a job
// ============================================================================

export async function getJobMeasurementSummary(jobId: string) {
  const [geometries, sessions, photos, rollPlans, auditLogs] = await Promise.all([
    getJobGeometries(jobId),
    getJobSessions(jobId),
    getJobPhotos(jobId),
    getJobRollPlans(jobId),
    getJobMeasurementAudit(jobId),
  ]);
  
  const totalAreaData = await getJobTotalArea(jobId);
  
  return {
    jobId,
    summary: {
      totalArea: totalAreaData.totalSqFt,
      roomCount: geometries.length,
      photoCount: photos.length,
      sessionCount: sessions.length,
      rollPlanCount: rollPlans.length,
    },
    geometries,
    sessions,
    photos,
    rollPlans,
    auditLogs: auditLogs.slice(0, 50), // Recent 50 audit entries
  };
}
