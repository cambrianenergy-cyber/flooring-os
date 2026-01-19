# Technical Direction

## iPad App — Native Stack

### Core Framework
- **Swift / SwiftUI** – Modern declarative UI with state management via Combine
- **Offline-first** – GRDB local SQLite store syncs with Firestore; app fully functional without connectivity
- **Custom Canvas** – Metal (3D/performance) or CoreGraphics (2D sketching/layout); layer-based geometry rendering
- **Apple Pencil** – Full pressure/tilt/azimuth support via `UITouch` and `PKCanvasView` integration

### Hardware Integration
- **Bluetooth Low Energy (BLE)** – Scan, connect, read characteristics for measurement devices
- **Device Abstraction Layer** – Protocol-based device interface allowing plug-and-play measurement sources
  - **Leica Disto** – BLE profile for laser distance/angle readings
  - **Bosch GLM** – Future: Drop-in replacement via same abstraction
  - **Manual Input** – Fallback for user entry or pen sketching

### Data Layer
- **GRDB Repositories** – Jobs, Rooms, Geometry, Measurements, Photos, Estimates, LineItems, Products, PriceBooks
- **Firestore Sync** – Bidirectional mappers for real-time and manual sync
- **Audit Trail** – Local logs captured before/after cloud sync for compliance

### Architecture Pattern
```
View (SwiftUI) 
  ↓
ViewModel (Combine + @StateObject)
  ↓
Service Layer (SyncManager, BluetoothManager, GeometryEngine)
  ↓
Repository Layer (GRDB + Firestore Mappers)
  ↓
Local Store (SQLite) + Remote (Firestore)
```

---

## Backend — Geometry & Rendering

### API Endpoints
- **POST /rooms/{id}/geometry** – Store geometry JSON (points, segments, labels, version)
- **POST /estimates/{id}/pdf** – Render PDF with dimensions, product lineups, cost breakdown
- **GET /audit/signature-log** – Retrieve signed/timestamped change history per job

### Geometry Format (JSON per Room)
```json
{
  "roomId": "room-123",
  "mode": "points|sketch",
  "version": 3,
  "points": [
    { "id": "p1", "x": 100, "y": 50, "label": "12' 4\"" }
  ],
  "segments": [
    { "id": "s1", "p1": "p1", "p2": "p2", "length": 148, "type": "wall" }
  ],
  "labels": [
    { "id": "l1", "segmentId": "s1", "text": "12' 4\"", "x": 120, "y": 65 }
  ],
  "updatedAt": "2026-01-15T10:30:00Z",
  "updatedBy": "user-456"
}
```

### PDF Rendering (Server-side)
- **Input:** Room geometry + Estimate lineItems + PriceBook rules
- **Output:** Multi-page PDF with:
  - Floor plan sketch with dimensions
  - Product takeoff table (sqft per product)
  - Labor & material cost breakdown
  - Customer signature line
  - Timestamp & job reference

### Audit & Signatures
- **Signature Log Table:** `jobId`, `roomId`, `action`, `actor`, `timestamp`, `hash`, `signature`
- **Purpose:** Non-repudiation for regulatory compliance (contractor/customer sign-off)
- **Format:** HMAC-SHA256 chained log entries

---

## Device Abstraction Example

### Protocol Definition
```swift
protocol MeasurementDevice {
  func connect(timeout: TimeInterval) async throws
  func disconnect() async throws
  func readDistance() async throws -> Measurement<UnitLength>
  func readAngle() async throws -> Angle
  func isConnected() -> Bool
}
```

### Leica Disto Implementation
```swift
class LeicaDistoDevice: MeasurementDevice {
  private var peripheral: CBPeripheral
  // CBUUID for Disto BLE service/characteristics
  // Handle notifications for live distance updates
}
```

### Future: Bosch GLM
```swift
class BoschGLMDevice: MeasurementDevice {
  // Same interface, different BLE UUID mapping
}
```

---

## Sync Strategy

### Local Writes
1. User sketches geometry on iPad
2. Geometry stored in GRDB (auto-saved, versioned)
3. Audit log captures change locally

### Sync on Connection
1. Query Firestore for remote version
2. Merge logic (last-write-wins or conflict resolution)
3. Upload local changes as batched operations
4. Download and apply remote changes
5. Update audit log with sync timestamp

### Offline Resilience
- App fully functional without network
- Sketching, measurements, estimates all work locally
- Sync queue tracks pending uploads
- Exponential backoff on sync failures

---

## Migration & Rollout

### Phase 1 (Current)
- Web: Laser measurement (legacy)
- iPad: Boilerplate, GRDB structure

### Phase 2
- Web: Square Measure™ default for new jobs
- iPad: Canvas + Apple Pencil sketching + local geometry

### Phase 3
- Web: Laser measurement removed, legacy jobs locked
- iPad: Leica BLE integration + PDF rendering + signature workflow

---

## Dependencies & Libraries

### iOS / Swift
- **SwiftUI** – Apple's declarative UI framework
- **Combine** – Reactive programming for state management
- **GRDB** – SQLite ORM for local persistence
- **CoreBluetooth** – BLE device scanning & communication
- **PDFKit** – PDF creation/rendering (or server-rendered fallback)

### Backend (Node.js / Firebase)
- **@firebase/firestore** – Real-time database
- **PDFKit / ReportLab** – Server-side PDF generation
- **jsonschema** – Geometry validation
- **crypto** – HMAC signing for audit logs

---

## Next Steps

1. **Expand MeasurementCore** – Add BluetoothManager protocol & Leica profile stub
2. **Canvas Scaffold** – Create SwiftUI Canvas + CoreGraphics layer
3. **Backend Geometry API** – Design and test storage/retrieval
4. **PDF Service** – Implement renderEstimate endpoint
5. **Audit Log Schema** – Design and migrate Firestore collection
