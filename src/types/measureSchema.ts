/**
 * Square Measure™ Database Schema
 * 
 * Firestore collections for laser measurement, geometry, and roll planning
 */

import { Timestamp } from "firebase/firestore";

// ============================================================================
// Core Types
// ============================================================================

export interface BaseDocument {
  workspaceId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // uid
}

export interface JobDocument extends BaseDocument {
  jobId: string;
}

export interface RoomDocument extends JobDocument {
  roomId: string;
}

// ============================================================================
// 1) measure_devices
// ============================================================================

export interface MeasureDevice extends BaseDocument {
  // Doc ID: {deviceId}
  name: string; // "Leica Disto X4"
  brand: string; // "leica"
  model: string; // "disto_x4"
  protocol: string; // "ble"
  ble: {
    deviceId: string;
    serviceUuids: string[];
    characteristicUuids: string[];
  };
  capabilities: {
    singleShot: boolean;
    continuous: boolean;
    tiltAngle: boolean;
    areaOnDevice: boolean;
  };
  status: "active" | "disabled";
  lastSeenAt: Timestamp;
  pairedBy: string; // uid
  firmwareVersion?: string;
  notes?: string;
}

// ============================================================================
// 2) measure_sessions
// ============================================================================

export interface MeasureSession extends JobDocument {
  // Doc ID: auto
  startedBy: string; // uid
  deviceId: string; // ref to measure_devices
  mode: "assisted_draw" | "walk_room" | "rect_by_size" | "manual";
  status: "active" | "ended" | "discarded";
  app: {
    platform: "ios" | "android" | "web";
    deviceModel: string; // "iPhone17,3"
    appVersion: string;
  };
  startedAt: Timestamp;
  endedAt?: Timestamp;
}

// ============================================================================
// 3) measure_readings
// ============================================================================

export interface MeasureReading extends RoomDocument {
  // Doc ID: auto
  sessionId: string; // ref to measure_sessions
  deviceId: string; // ref to measure_devices
  reading: {
    value: number; // inches or mm (canonical)
    unit: "in" | "mm";
    display: string; // "12' 6 3/8""
    type: "single" | "continuous";
    signalQuality?: number; // 0-100
    tiltAngleDeg?: number;
  };
  capturedAt: Timestamp;
  capturedBy: string; // uid
  appliedTo?: {
    geometryId?: string;
    segmentId?: string;
  };
  note?: string;
}

// ============================================================================
// 4) measure_geometries
// ============================================================================

export interface GeometryPoint {
  id: string;
  x: number;
  y: number;
  locked?: boolean;
}

export interface GeometrySegment {
  id: string;
  a: string; // pointId
  b: string; // pointId
  length: number;
  source: "laser" | "manual" | "derived";
  readingId?: string;
  locked?: boolean;
}

export interface GeometryOpening {
  id: string;
  type: "door" | "arch" | "opening" | "stair" | "closet" | "window";
  segmentId?: string;
  width: number;
  offsetFromA?: number;
  notes?: string;
}

export interface GeometryArea {
  id: string;
  name: string;
  polygonPointIds: string[];
  type: "main" | "closet" | "island" | "excluded";
  notes?: string;
}

export interface GeometryLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  type: "dimension" | "note" | "tag";
}

export interface MeasureGeometry extends RoomDocument {
  // Doc ID: {roomId} or auto
  version: number;
  status: "draft" | "final" | "archived";
  units: {
    canonical: "in" | "mm";
    display: "ft_in" | "metric";
  };
  origin: {
    x: number;
    y: number;
  };
  points: GeometryPoint[];
  segments: GeometrySegment[];
  openings: GeometryOpening[];
  areas: GeometryArea[];
  labels: GeometryLabel[];
  calculations: {
    area: number; // sq in or sq mm
    perimeter: number;
    baseboardLf?: number;
  };
  confidence: {
    score: number; // 0-100
    breakdown: {
      laserCoveragePct: number;
      manualEditsCount: number;
      closureError: number;
    };
  };
  locks?: {
    lockedBy?: string; // uid
    lockedAt?: Timestamp;
  };
}

// ============================================================================
// 5) measure_geometry_versions
// ============================================================================

export interface MeasureGeometryVersion extends RoomDocument {
  // Doc ID: auto
  geometryId: string;
  version: number;
  snapshot: MeasureGeometry; // full copy
  reason: "autosave" | "finalize" | "edit" | "rollback";
}

// ============================================================================
// 6) measure_photos
// ============================================================================

export interface MeasurePhoto extends JobDocument {
  // Doc ID: auto
  roomId?: string;
  storagePath: string; // Firebase Storage path
  thumbPath?: string;
  caption?: string;
  linkedTo?: {
    geometryId?: string;
    segmentId?: string;
    pointId?: string;
  };
  takenAt?: Timestamp;
  takenBy: string; // uid
}

// ============================================================================
// 7) measure_material_rules
// ============================================================================

export interface MeasureMaterialRules extends BaseDocument {
  // Doc ID: auto
  name: string; // "Default LVP Rules"
  scope: "workspace" | "global";
  rules: {
    defaultWastePct: number;
    wasteByRoomComplexity?: Record<string, number>; // simple: 8%, complex: 12%
    rounding: {
      areaRoundUpSqFt: number;
      lfRoundUp: number;
    };
    boxConversion?: {
      sqFtPerBox?: number;
      minBoxes?: number;
    };
    appliesTo: string[]; // product categories
  };
}

// ============================================================================
// 8) measure_roll_plans
// ============================================================================

export interface RollPlanCut {
  id: string;
  width: number;
  length: number;
  area: number;
  notes?: string;
}

export interface RollPlanSeam {
  id: string;
  pathPointIds: string[];
  type: "primary" | "secondary";
}

export interface MeasureRollPlan extends RoomDocument {
  // Doc ID: auto
  geometryId: string;
  status: "draft" | "final";
  inputs: {
    rollWidth: number; // inches/mm
    direction: "north" | "south" | "east" | "west" | "custom";
    patternMatch: boolean;
    patternRepeat?: number;
    minSeamDistanceFromDoor?: number;
    allowSeamsInMainArea: boolean;
  };
  outputs: {
    cuts: RollPlanCut[];
    seams: RollPlanSeam[];
    wasteArea: number;
    efficiencyPct: number;
  };
  generatedBy: {
    mode: "auto" | "assisted";
    agent?: string; // future AI
  };
}

// ============================================================================
// 9) measure_installer_packets
// ============================================================================

export interface MeasureInstallerPacket extends JobDocument {
  // Doc ID: auto
  roomIds: string[];
  packet: {
    title: string;
    notes: string;
    includes: {
      geometries: boolean;
      rollPlans: boolean;
      photos: boolean;
      materialsSummary: boolean;
    };
  };
  pdf?: {
    storagePath: string;
    generatedAt: Timestamp;
  };
  sharedWith?: {
    emails: string[];
    links?: Array<{
      url: string;
      expiresAt: Timestamp;
    }>;
  };
}

// ============================================================================
// 10) measure_exports
// ============================================================================

export interface MeasureExport extends JobDocument {
  // Doc ID: auto
  roomId?: string;
  type: "pdf_plan" | "json_geometry" | "dxf" | "image_png";
  source?: {
    geometryId?: string;
    rollPlanId?: string;
  };
  file: {
    storagePath: string;
    fileName: string;
  };
}

// ============================================================================
// 11) measure_audit_logs
// ============================================================================

export interface MeasureAuditLog extends BaseDocument {
  // Doc ID: auto
  jobId?: string;
  roomId?: string;
  actorId: string; // uid
  action: string;
  // Examples:
  // - "measure.session_started"
  // - "measure.reading_captured"
  // - "measure.segment_assigned"
  // - "measure.geometry_finalized"
  // - "measure.roll_plan_generated"
  target: {
    collection: string;
    docId: string;
  };
  meta?: Record<string, unknown>; // flexible
}

// ============================================================================
// 12) measure_entitlements_cache
// ============================================================================

export interface MeasureEntitlementsCache {
  // Doc ID: {workspaceId}
  workspaceId: string;
  tier: string;
  features: Record<string, boolean>;
  maxUsers: number | "unlimited";
  syncedAt: Timestamp;
}

// ============================================================================
// Collection Names (for queries)
// ============================================================================

export const MEASURE_COLLECTIONS = {
  DEVICES: "measure_devices",
  SESSIONS: "measure_sessions",
  READINGS: "measure_readings",
  GEOMETRIES: "measure_geometries",
  GEOMETRY_VERSIONS: "measure_geometry_versions",
  PHOTOS: "measure_photos",
  MATERIAL_RULES: "measure_material_rules",
  ROLL_PLANS: "measure_roll_plans",
  INSTALLER_PACKETS: "measure_installer_packets",
  EXPORTS: "measure_exports",
  AUDIT_LOGS: "measure_audit_logs",
  ENTITLEMENTS_CACHE: "measure_entitlements_cache",
} as const;
