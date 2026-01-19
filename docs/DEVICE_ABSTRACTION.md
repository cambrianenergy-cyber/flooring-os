---
title: "Device Abstraction Layer & Cross-Platform Geometry Architecture"
date: "2026-01-01"
---

# Device Abstraction Layer & Cross-Platform Architecture

## Executive Summary

This document codifies the architecture for a **professional field-to-sale flooring measurement system** that works across iOS, iPadOS, and Android.

**Key Principle:** App talks to abstractions, not to hardware or OS-specific APIs. This enables:
- Swapping laser devices (Leica → Bosch → Hilti) without app rewrites
- Identical geometry calculations across all platforms (no device-specific discrepancies)
- Cross-device workflows (measure on iPhone, finalize on iPad, sign anywhere)

---

## Part 1: Laser Device Abstraction Layer

### Problem: Device Lock-In

If you hardcode Leica directly into your app:
```typescript
// ❌ BAD: Laser device is hardcoded
class MeasureScreen {
  leica = new LeicaDevice();
  measure() { return leica.measure(); }
}
```

Adding Bosch requires rewriting the entire app's measurement logic.

### Solution: Abstract Interface

```typescript
// ✅ GOOD: Any laser device implements the same interface
abstract class AbstractLaserDevice {
  abstract measure(): Promise<MeasurementReading>;
  abstract startContinuous(onMeasure): Promise<void>;
  abstract getCapabilities(): LaserCapabilities;
}

class LeicaDistoDevice extends AbstractLaserDevice { /* ... */ }
class BoschGLMDevice extends AbstractLaserDevice { /* ... */ }
```

Now measurement code works with any device:
```typescript
const device: AbstractLaserDevice = laserDeviceManager.getConnectedDevice();
const reading = await device.measure(); // Works for Leica, Bosch, etc.
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       React Components                       │
│                  (iPhone, iPad, Android UI)                  │
│                                                               │
│     <MeasureButton /> → useLaserMeasurement()                │
│     <WalkTheRoom /> → useLaserContinuous()                   │
│     <BatteryIndicator /> → useLaserBattery()                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
        ┌──────────────────────────────┐
        │   React Hooks Layer           │
        │ (useLaserDevice, etc.)        │
        └──────────────────────────────┘
                       │
                       ↓
        ┌──────────────────────────────┐
        │   LaserDeviceManager          │
        │ (device discovery, switching) │
        └──────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
    ┌─────────┐  ┌──────────┐  ┌──────────┐
    │  Leica  │  │  Bosch   │  │  Hilti   │
    │  Disto  │  │   GLM    │  │   PD     │
    │ Device  │  │  Device  │  │  Device  │
    └─────────┘  └──────────┘  └──────────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
        ┌──────────────┴──────────────┐
        ↓                             ↓
   iOS BLE Stack          Android BLE Stack
   (Web Bluetooth)        (Android BLE APIs)
```

### Supported Devices

#### Leica Disto (Current)
- **Models:** D810, D3
- **Interface:** BLE (Bluetooth Low Energy)
- **Service UUID:** 0xFFF0
- **Distance:** 0.05m to 400m (D810), 60m (D3)
- **Accuracy:** ±1mm (D810), ±2mm (D3)
- **Features:** Continuous mode, bearing (D810 only)

#### Bosch GLM (Planned)
- **Models:** GLM 120, GLM 165
- **Interface:** BLE
- **Distance:** Up to 165m
- **Features:** Area calculation onboard

#### Hilti PD (Planned)
- **Models:** PD-E, PD-I
- **Interface:** BLE + USB
- **Distance:** Up to 200m
- **Features:** Slope-corrected distance

### API Example

#### Single Measurement
```typescript
import { useLaserMeasurement } from "@/lib/useLaserDevice";

function MeasureButton() {
  const { measure, measurement, isLoading, error } = useLaserMeasurement();

  return (
    <div>
      <button onClick={measure} disabled={isLoading}>
        {isLoading ? "Measuring..." : "Measure"}
      </button>
      {measurement && <p>{measurement.distance.toFixed(2)}m</p>}
      {error && <p className="error">{error.message}</p>}
    </div>
  );
}
```

#### Walk-the-Room (Continuous)
```typescript
import { useLaserContinuous } from "@/lib/useLaserDevice";

function WalkTheRoomMode() {
  const { isActive, measurements, start, stop } = useLaserContinuous({
    onMeasurement: (reading) => {
      // Leica fires ~10 readings/second in continuous mode
      // App places points on geometry, updates in real-time
    },
  });

  return (
    <div>
      <button onClick={isActive ? stop : start}>
        {isActive ? "Stop" : "Start"} Walk-The-Room
      </button>
      <p>Readings captured: {measurements.length}</p>
    </div>
  );
}
```

#### Device Discovery & Connection
```typescript
import { useLaserConnection } from "@/lib/useLaserDevice";

function ConnectDevice() {
  const { discover, connect, connecting, error } = useLaserConnection();

  const handleConnect = async () => {
    const devices = await discover();
    if (devices.length > 0) {
      await connect(devices[0]);
    }
  };

  return (
    <button onClick={handleConnect} disabled={connecting}>
      {connecting ? "Connecting..." : "Find Laser"}
    </button>
  );
}
```

---

## Part 2: Shared Geometry Engine

### Core Principle

**All platforms compute geometry identically.**

iPhone, iPad, Android all use:
- Same Point/Segment/Polygon data model
- Same area calculation (Shoelace formula)
- Same validation rules
- Same undo/redo logic

Only the UI rendering differs.

### Geometry Data Model

```typescript
interface GeometryData {
  // Core shapes
  points: Point[];        // Vertices (feet from origin)
  segments: Segment[];    // Walls connecting points
  labels: Label[];        // Annotations ("24' wall", etc.)
  layers: Layer[];        // Organization (flooring, demo, etc.)

  // Computed
  perimeter: number;      // feet (auto-calculated)
  area: number;          // square feet (auto-calculated)
  closedPolygon: boolean; // Is topology valid?

  // Metadata
  roomId: string;
  jobId: string;
  mode: "points" | "sketch" | "laser-legacy";
  version: number;
  updatedAt: number;
  updatedBy: string;
}

interface ComputedGeometry {
  perimeter: number;
  area: number;
  isClosed: boolean;
  validationErrors: ValidationError[];
  bounds: { minX, maxX, minY, maxY };
  centroid: { x, y };  // For label placement
}
```

### Engine Operations

The `GeometryEngine` class provides:

```typescript
class GeometryEngine {
  // Add points
  addPoint(x: number, y: number, snapRules?: SnapRulesEngine): Point

  // Move/remove
  movePoint(pointId: string, x: number, y: number): void
  removePoint(pointId: string): void

  // Create segments (walls)
  addSegment(p1Id: string, p2Id: string, type: "wall" | "door"): Segment
  closePolygon(): void  // Close shape if ≥3 points

  // Compute derived values
  computePerimeter(): number
  computeArea(): number
  exportComputed(): ComputedGeometry

  // Undo/redo (immutable transaction stack)
  undo(): void
  redo(): void
}
```

### Example: Device-Agnostic Workflow

Measurement comes from Leica (BLE):

```typescript
// In WalkTheRoom component (runs on all platforms)
const { isActive, measurements, start, stop } = useLaserContinuous();

const walk = async () => {
  await start();

  // Each Leica reading:
  // measurements = [
  //   { distance: 5.2, bearing: 0, timestamp: ... },
  //   { distance: 4.8, bearing: 90, timestamp: ... },
  //   ...
  // ]

  // Convert to geometry (shared logic, no device-specific code)
  for (const reading of measurements) {
    const point = geometryEngine.addPoint(reading.distance, 0);
    geometryEngine.addSegment(lastPoint.id, point.id, "wall");
    lastPoint = point;
  }

  geometryEngine.closePolygon();
  const { area, perimeter } = geometryEngine.exportComputed();

  // Same `area` and `perimeter` on iPhone, iPad, Android
  // No "wait, the area is different on Android" bugs
};
```

### Why This Matters Legally & Commercially

1. **Consistency:** Customer gets same estimate whether they measure on iPhone or iPad
2. **Auditability:** Geometry JSON is identical across devices (helps with disputes)
3. **Testing:** Test geometry logic once, not per-platform
4. **Maintenance:** Fix an area bug in one place, all platforms get it

---

## Part 3: Cross-Device Workflow

### Real-World User Journey

**Day 1: Site Measurement (iPhone)**
```
Field worker arrives at job site
  ↓
Opens flooring app on iPhone
  ↓
Opens "New Room" → iPhone geometry editor
  (Compact: 360×480px canvas, tap-to-place, numeric input)
  ↓
Connects Leica Disto via BLE (bluetooth device selection)
  ↓
"Walk-The-Room" mode:
  - Walks perimeter, Leica fires distance readings
  - App auto-places points, auto-closes polygon
  ↓
Photos: Tap to capture flooring condition, doors, fixtures
  ↓
Signature: Customer signs on iPhone
  ↓
Sync to Firestore ← Offline-capable
  - Geometry JSON
  - Photos
  - Signature
  - Timestamp, worker ID
```

**Day 2: Office (iPad)**
```
Estimator opens flooring app on iPad
  ↓
Jobs list → finds yesterday's room
  ↓
Geometry is already there (synced from field worker's iPhone)
  ↓
iPad geometry editor (full-power: side-by-side, Apple Pencil)
  - Review wall layout
  - Adjust points if needed (tape measure was ~3" off)
  - Add doors, windows
  - Measure under carpet
  ↓
Run Roll-Cut Optimizer
  (iPad-only feature, requires full power)
  - Input: geometry + product width
  - Output: seam layout, waste %
  ↓
Generate PDF estimate
  - Floor plan (from geometry)
  - Takeoff (area × product)
  - Cut list (from optimizer)
  - Pricing
  ↓
Customer signs PDF on iPad
  ↓
Email + archive
```

**Day 3: Customer Signature (Phone or Tablet)**
```
Customer link in email
  ↓
Opens on customer's iPhone or iPad
  ↓
(Whole-app or just "sign" page)
  ↓
Reviews floor plan (geometry rendered)
  ↓
Signs with finger
  ↓
Locked (immutable signature audit log)
```

### Cross-Device Data Sync

```
iPhone (Field)
  └─ measure, photo, sign
  └─ Firestore upload (with retry, offline queue)
                ↓
         Firestore (Source of Truth)
           ├─ jobs/{jobId}/
           │   └─ rooms/{roomId}/
           │       ├─ geometry/current (GeometryData JSON)
           │       ├─ photos/ (array)
           │       ├─ signature/ (image)
           │       └─ metadata
                ↓
          iPad (Office)
            └─ download, edit, finalize
```

### Device Feature Matrix

| Feature | iPhone | iPad | Android-Phone | Android-Tablet | Desktop |
|---------|--------|------|---------------|----------------|---------|
| Measure (Laser) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Walk-The-Room | ✅ | ✅ | ✅ | ✅ | ❌ |
| Tap-to-Place | ✅ | ✅ | ✅ | ✅ | ❌ |
| Apple Pencil | ❌ | ✅ | ❌ | ❌ | ❌ |
| Freehand Draw | ❌ | ✅ | ❌ | ⚠️ | ❌ |
| Roll-Cut Optimizer | ❌ | ✅ | ❌ | ⚠️ | ❌ |
| Full Geometry Edit | ⚠️ | ✅ | ❌ | ⚠️ | ❌ |
| Browse Catalog | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| Create Estimate | ✅ | ✅ | ❌ | ✅ | ✅ |

Legend: ✅ = full support, ⚠️ = limited, ❌ = not supported

---

## Part 4: Implementation Roadmap

### Phase 1: Laser Device Abstraction (Current)

**Status:** 🟢 Complete
- `LaserDeviceAbstraction.ts` — Abstract base class
- `LeicaDistoDevice.ts` — Leica BLE implementation
- `useLaserDevice.tsx` — React hooks

**Next:** iOS/Android native bridge implementations

### Phase 2: Geometry Engine Sync

**Status:** 🟡 In Progress
- `GeometryEngine.ts` — Core operations (✅ done)
- `SnapRules.ts` — Magnetic snapping (✅ done)
- `GeometryValidation.ts` — Topology checks (✅ done)
- Firestore sync rules — Cross-device read/write

### Phase 3: UI Layer

**Status:** 🔴 To-Do
- iPhone geometry editor (✅ component sketched)
- iPad geometry editor (freehand + Apple Pencil)
- Android geometry editor (touch-optimized)
- Walk-the-room UI (✅ component sketched)

### Phase 4: Advanced Features

**Status:** 🔴 To-Do
- Roll-Cut Optimizer (iPad-only)
- PDF floor plan generator
- Product catalog integration
- Pricing engine

---

## Part 5: Device-Specific Considerations

### iOS/iPadOS

- **Laser:** Web Bluetooth API (in Safari)
  - Or: Native Swift module for more control
- **Storage:** GRDB (local SQLite) + Firestore
- **UI:** SwiftUI (native, best performance)
- **Background:** iOS background task API for offline queue
- **Apple Pencil:** `UITouch.pencilInteractionEnabled`

### Android

- **Laser:** Android BLE APIs
  - `BluetoothAdapter.startDiscovery()`
  - `BluetoothGatt` for characteristic notifications
- **Storage:** Room (SQLite wrapper) + Firestore
- **UI:** Jetpack Compose (native, Kotlin)
- **Background:** WorkManager for offline queue
- **Stylus:** Pressure-sensitive touch events

### Web (Admin Dashboard)

- **Laser:** ❌ N/A (office use)
- **Storage:** Firestore only (no local DB)
- **UI:** React + Next.js
- **View-Only:** Can view geometry, PDFs, signatures
- **Edit-Only:** iPad/Android tablet recommended

---

## Part 6: Security & Audit

### Geometry Immutability

Each edit creates a transaction:
```typescript
interface UndoFrame {
  timestamp: number;
  userId: string;
  operation: GeometryOperation;
  before: GeometryData;
  after: GeometryData;
}
```

Firestore stores entire undo stack → Audit trail.

### Signature Audit Log

```typescript
interface SignatureRecord {
  signatureImage: string; // Base64
  signedAt: number; // Timestamp
  signedBy: string; // User ID
  signatureType: "customer" | "installer" | "manager";
  deviceInfo: {
    platform: "ios" | "android" | "web";
    model: string;
    osVersion: string;
  };
  geometryVersion: number; // Which geometry was signed
  pdfUrl: string; // Immutable PDF link
}
```

---

## File Inventory

```
src/lib/
├── LaserDeviceAbstraction.ts      # Abstract interface + manager
├── LeicaDistoDevice.ts             # Leica BLE implementation
├── useLaserDevice.tsx              # React hooks
├── GeometryEngine.ts               # Core geometry operations
├── SnapRules.ts                    # Magnetic snapping engine
├── GeometryValidation.ts           # Topology validation
├── geometrySchema.ts               # TypeScript types
├── platformStrategy.ts             # Device capabilities matrix
├── deviceDetection.ts              # UA parsing + native bridge
├── deviceDetectionProvider.tsx     # React context
└── ... (other utilities)

src/components/
├── iPhoneGeometryEditor.tsx        # Compact phone UI
├── WalkTheRoom.tsx                 # Field measurement UX
└── FeatureGate.tsx                 # Device capability gates

docs/
├── GEOMETRY_ENGINE_INTEGRATION.md
├── PLATFORM_STRATEGY.md
└── DEVICE_ABSTRACTION.md (this file)
```

---

## Next Steps

1. **iOS Native Bridge** (2-3 days)
   - Objective-C/Swift module for BLE + device info
   - Connect to web Bluetooth wrapper

2. **Android BLE Integration** (2-3 days)
   - Kotlin module for BLE scanning + connection
   - Firestore sync with WorkManager background tasks

3. **Firestore Sync Rules** (1 day)
   - Geometry read/write permissions
   - Offline conflict resolution (last-write-wins for MVP)

4. **iPad Full Geometry Editor** (3-5 days)
   - Apple Pencil support
   - Freehand drawing + shape recognition

5. **Roll-Cut Optimizer** (5-7 days)
   - Seam layout algorithm
   - Waste calculation
   - Cut list generation

---

## Conclusion

You're building a **professional field-to-sale system**, not a toy app.

✅ Same geometry calculations across all devices  
✅ Swappable laser devices (Leica → Bosch → Hilti)  
✅ Cross-device workflows (field → office → customer)  
✅ Audit trail + immutable signatures  
✅ Feature gating by device capability  

This architecture scales to 10,000+ installs without rework.
