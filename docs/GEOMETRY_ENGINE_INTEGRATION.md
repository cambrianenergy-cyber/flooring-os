/**
 * GEOMETRY ENGINE INTEGRATION GUIDE
 * 
 * End-to-end flow: iPad sketch → Firestore sync → Web visualization
 * 
 * This document walks through the complete lifecycle of a room measurement
 * using the geometry engine, from first touch to cloud persistence.
 */

// ============================================================================
// PART 1: USER INTERACTION — iPad Sketch Interface
// ============================================================================

/**
 * SwiftUI View (iOS)
 * 
 * User taps to place points. Engine snaps each point to grid/walls/angles.
 * Points form a polygon. User confirms closure. Geometry exports to JSON.
 */

/*
import SwiftUI
import Combine

struct RoomSketchView: View {
    @State var geometry = GeometryData()
    @State var geometryEngine: GeometryEngine
    @State var undoDisabled = true
    @State var redoDisabled = true
    
    let snapRules = SnapRulesEngine()
    let validator = GeometryValidator()
    
    var body: some View {
        VStack {
            // Canvas — drag and tap to place points
            RoomCanvas(
                geometry: geometry,
                onTapPoint: handleTapPoint,
                onDragPoint: handleDragPoint
            )
            .frame(height: 500)
            
            // Controls
            HStack {
                Button(action: handleUndo) {
                    Label("Undo", systemImage: "arrow.uturn.backward")
                }.disabled(undoDisabled)
                
                Button(action: handleRedo) {
                    Label("Redo", systemImage: "arrow.uturn.forward")
                }.disabled(redoDisabled)
                
                Spacer()
                
                if geometry.points.count >= 3 && !geometry.closedPolygon {
                    Button(action: handleClosePolygon) {
                        Label("Close Room", systemImage: "checkmark.circle.fill")
                    }
                }
                
                if geometry.closedPolygon {
                    Button(action: handleSaveToFirestore) {
                        Label("Save", systemImage: "icloud.and.arrow.up.fill")
                    }
                    .foregroundColor(.green)
                }
            }
            .padding()
            
            // Status display
            StatusBar(
                pointCount: geometry.points.count,
                perimeter: geometryEngine.computePerimeter(),
                area: geometryEngine.computeArea(),
                validationErrors: geometryEngine.validate()
            )
        }
        .onChange(of: geometryEngine.undoStack) { undoDisabled = $0.isEmpty }
        .onChange(of: geometryEngine.redoStack) { redoDisabled = $0.isEmpty }
    }
    
    // MARK: - Event Handlers
    
    func handleTapPoint(x: Double, y: Double) {
        // Validate point placement
        let validationError = GeometryValidator.validatePointPlacement(x, y, geometry: geometry)
        if let error = validationError {
            showAlert(title: "Cannot place point", message: error.message)
            return
        }
        
        // Add point via engine (applies snapping)
        do {
            let point = try geometryEngine.addPoint(
                x: x,
                y: y,
                snapRules: snapRules
            )
            geometry = geometryEngine.geometry
            
            // If we have 2+ points, auto-create segment
            if geometry.points.count >= 2 {
                let lastPoint = geometry.points[geometry.points.count - 2]
                try geometryEngine.addSegment(
                    from: lastPoint.id,
                    to: point.id,
                    type: .wall
                )
                geometry = geometryEngine.geometry
            }
        } catch {
            showAlert(title: "Error adding point", message: error.localizedDescription)
        }
    }
    
    func handleDragPoint(pointId: String, to x: Double, to y: Double) {
        do {
            let point = try geometryEngine.movePoint(
                pointId: pointId,
                to: x,
                to: y,
                snapRules: snapRules
            )
            geometry = geometryEngine.geometry
        } catch {
            showAlert(title: "Error moving point", message: error.localizedDescription)
        }
    }
    
    func handleUndo() {
        do {
            try geometryEngine.undo()
            geometry = geometryEngine.geometry
        } catch {
            showAlert(title: "Undo failed", message: error.localizedDescription)
        }
    }
    
    func handleRedo() {
        do {
            try geometryEngine.redo()
            geometry = geometryEngine.geometry
        } catch {
            showAlert(title: "Redo failed", message: error.localizedDescription)
        }
    }
    
    func handleClosePolygon() {
        // Validate polygon closure
        let validationError = GeometryValidator.validatePolygonClosure(geometry)
        if let error = validationError {
            showAlert(title: "Cannot close polygon", message: error.message)
            return
        }
        
        do {
            _ = try geometryEngine.closePolygon()
            geometry = geometryEngine.geometry
        } catch {
            showAlert(title: "Error closing polygon", message: error.localizedDescription)
        }
    }
    
    func handleSaveToFirestore() {
        // Validate entire geometry
        let errors = geometryEngine.validate()
        let criticalErrors = errors.filter { $0.severity == "error" }
        
        if !criticalErrors.isEmpty {
            showAlert(
                title: "Validation failed",
                message: criticalErrors.map { $0.message }.joined(separator: "\n")
            )
            return
        }
        
        // Export computed geometry
        let computed = geometryEngine.exportComputed()
        let export = GeometryExport(
            geometry: geometryEngine.geometry,
            computed: computed,
            exportedAt: Date().timeIntervalSince1970,
            format: "json"
        )
        
        // POST to backend
        Task {
            do {
                let encoded = try JSONEncoder().encode(export)
                var request = URLRequest(url: URL(string: "/api/geometry/\(geometry.roomId)")!)
                request.httpMethod = "POST"
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                request.httpBody = encoded
                
                let (_, response) = try await URLSession.shared.data(for: request)
                guard (response as? HTTPURLResponse)?.statusCode == 200 else {
                    throw NSError(domain: "HTTP", code: -1, userInfo: nil)
                }
                
                showAlert(title: "Saved", message: "Room geometry saved to Firestore")
                // Navigate back to job view
            } catch {
                showAlert(title: "Save failed", message: error.localizedDescription)
            }
        }
    }
}
*/


// ============================================================================
// PART 2: POINT PLACEMENT WITH SNAPPING
// ============================================================================

/**
 * STEP 1: User taps screen at (1204 px, 380 px)
 * Screen: iPad 1024×768 display (40 pixels = 1 foot)
 * 
 * Convert to feet:
 *   screenX = 1204 px ÷ 40 = 30.1 feet
 *   screenY = 380 px ÷ 40 = 9.5 feet
 */

const USER_TAP_PIXELS = { x: 1204, y: 380 };
const PIXELS_PER_FOOT = 40;
const FEET = {
  x: USER_TAP_PIXELS.x / PIXELS_PER_FOOT, // 30.1 feet
  y: USER_TAP_PIXELS.y / PIXELS_PER_FOOT, // 9.5 feet
};

/**
 * STEP 2: SnapRulesEngine evaluates snapping
 * 
 * Geometry state:
 *   - Points: [(10, 5), (30, 5), (30, 15)]  // 3 existing points
 *   - Segments: [(0→1), (1→2)]              // 2 walls
 * 
 * Snap checks (in priority order):
 */

// Priority 1: Wall lock
//   - Check if tap is within 24 pixels of any segment
//   - Distance to segment 0→1 (from (10,5) to (30,5)): ~4 pixels
//     Snap point: (30.1, 5.0) [snapped to wall horizontally]
//   - Distance to segment 1→2: ~16 pixels
//   - Result: SNAP to segment 0→1

const WALL_SNAP = { x: 30.1, y: 5.0, snappedTo: "wall" };

/**
 * STEP 3: GeometryEngine.addPoint() creates point with snapped coords
 */

const NEW_POINT = {
  id: "uuid-abc123",
  x: 30.1,           // snapped
  y: 5.0,            // snapped
  timestamp: 1704067200,
  label: null,
};

/**
 * STEP 4: Engine auto-creates segment from last point to new point
 * 
 * Last point: (30, 15)
 * New point:  (30.1, 5)
 * Distance: √((30.1-30)² + (5-15)²) = √(0.01 + 100) ≈ 10 feet
 */

const NEW_SEGMENT = {
  id: "uuid-def456",
  p1Id: "uuid-point-2",  // (30, 15)
  p2Id: "uuid-abc123",   // (30.1, 5) — new point
  type: "wall",
  length: 10.0,          // feet
  angle: 270,            // degrees (pointing down)
  timestamp: 1704067200,
};

/**
 * STEP 5: undo/redo frame recorded
 * 
 * Transaction added to undo stack:
 *   {
 *     id: "uuid-frame-1",
 *     timestamp: 1704067200,
 *     operation: { type: "add-point", point: NEW_POINT },
 *     description: "Add point at (30.1, 5.0)"
 *   }
 */


// ============================================================================
// PART 3: POLYGON CLOSURE
// ============================================================================

/**
 * After 5 taps, room is roughly sketched:
 *   Points: [(10,5), (30,5), (30,15), (20,18), (10,12)]
 *   Segments: 4 walls connecting consecutive points
 * 
 * User taps "Close Room" button
 */

/**
 * STEP 1: Validation check
 * 
 * GeometryValidator.validatePolygonClosure():
 *   - Point count: 5 ≥ 3 ✓
 *   - Perimeter: 10 + 10 + 3 + 14.14 + 8.06 = 45.2 feet ✓
 *   - No self-intersections ✓
 */

/**
 * STEP 2: Engine closes polygon
 * 
 * GeometryEngine.closePolygon():
 *   - Add closing segment: (10,12) → (10,5)
 *   - Set geometry.closedPolygon = true
 */

const CLOSING_SEGMENT = {
  id: "uuid-seg5",
  p1Id: "uuid-point-4",  // (10, 12)
  p2Id: "uuid-point-0",  // (10, 5)
  type: "wall",
  length: 7.0,
  angle: 270,
};

/**
 * STEP 3: Compute derived geometry
 * 
 * Exported via geometryEngine.exportComputed():
 *   - Perimeter: 45.2 feet (sum of all segments)
 *   - Area: 176.4 sq feet (Shoelace formula)
 *   - Centroid: (18.2, 11.0)
 *   - Bounds: { minX: 10, maxX: 30, minY: 5, maxY: 18 }
 *   - Validation: [] (no errors)
 *   - isClosed: true
 */

const EXPORTED_COMPUTED = {
  perimeter: 45.2,
  area: 176.4,
  validationErrors: [],
  isClosed: true,
  bounds: { minX: 10, maxX: 30, minY: 5, maxY: 18 },
  centroid: { x: 18.2, y: 11.0 },
};


// ============================================================================
// PART 4: FIRESTORE PERSISTENCE
// ============================================================================

/**
 * POST /api/geometry/rooms/{roomId}
 * 
 * Body (GeometryExport):
 */

const FIRESTORE_PAYLOAD = {
  geometry: {
    id: "geo-uuid",
    roomId: "room-123",
    jobId: "job-456",
    workspaceId: "workspace-789",
    points: [
      { id: "uuid-p0", x: 10, y: 5, label: "NW", timestamp: 1704067200 },
      { id: "uuid-p1", x: 30, y: 5, label: "NE", timestamp: 1704067200 },
      { id: "uuid-p2", x: 30, y: 15, label: "SE", timestamp: 1704067200 },
      { id: "uuid-p3", x: 20, y: 18, label: "S", timestamp: 1704067200 },
      { id: "uuid-p4", x: 10, y: 12, label: "W", timestamp: 1704067200 },
    ],
    segments: [
      // ... 5 wall segments
    ],
    labels: [
      { id: "lbl-1", text: "24' wall", x: 20, y: 5.5, timestamp: 1704067200 },
    ],
    layers: [
      { id: "layer-1", name: "Flooring", visible: true, locked: false, pointIds: ["uuid-p0", ...], segmentIds: ["uuid-s0", ...] },
      // ... other layers
    ],
    constraints: [],
    mode: "sketch",
    closedPolygon: true,
    perimeter: 45.2,
    area: 176.4,
    version: 1,
    updatedAt: 1704067200,
    updatedBy: "user-123",
    deviceOrientation: "landscape",
  },
  computed: EXPORTED_COMPUTED,
  exportedAt: 1704067200,
  format: "json",
};

/**
 * Backend (src/app/api/geometry/route.ts) stores to Firestore:
 * 
 * jobs/{jobId}/rooms/{roomId}/geometry/current = FIRESTORE_PAYLOAD
 * 
 * Path: jobs/job-456/rooms/room-123/geometry/current
 */


// ============================================================================
// PART 5: WEB VISUALIZATION
// ============================================================================

/**
 * React component (web) listens for changes via Firestore real-time update
 */

/*
import { onSnapshot } from "firebase/firestore";
import { GeometryCanvas } from "@/components/GeometryCanvas";

export function RoomDetailPage({ jobId, roomId }) {
  const [geometry, setGeometry] = useState<GeometryData | null>(null);
  const [computed, setComputed] = useState<ComputedGeometry | null>(null);
  
  useEffect(() => {
    const docRef = doc(db, `jobs/${jobId}/rooms/${roomId}/geometry/current`);
    
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as GeometryExport;
        setGeometry(data.geometry);
        setComputed(data.computed);
      }
    });
    
    return unsubscribe;
  }, [jobId, roomId]);
  
  return (
    <div>
      <h1>Room: {geometry?.roomId}</h1>
      <p>{computed?.area.toFixed(0)} sq ft | {computed?.perimeter.toFixed(1)} ft perimeter</p>
      <GeometryCanvas geometry={geometry} />
    </div>
  );
}
*/

/**
 * GeometryCanvas renders the room outline on web
 * 
 * For each point:
 *   screenX = point.x * 40 pixels (PIXELS_PER_FOOT)
 *   screenY = point.y * 40 pixels
 * 
 * For each segment:
 *   Draw line from (p1.screenX, p1.screenY) to (p2.screenX, p2.screenY)
 * 
 * Example render:
 *   - 5 points drawn as circles
 *   - 5 segments drawn as lines
 *   - Area label "176 sqft" at centroid (18.2 * 40, 11.0 * 40) = (728, 440)
 */


// ============================================================================
// PART 6: EXPORTING TO PDF
// ============================================================================

/**
 * When user generates estimate PDF:
 * 
 * src/lib/pdfRenderer.ts receives:
 *   - geometry: GeometryData (from Firestore)
 *   - computed: ComputedGeometry
 *   - lineItems: EstimateLineItem[]
 * 
 * Page 1: Floor plan
 *   - Render room polygon as page background (scale: 0.5" per foot on 8.5x11")
 *   - Place area label (176 sqft)
 *   - Add dimension labels (24' wall, etc.)
 * 
 * Page 2: Takeoff table
 *   - Area: 176.4 sqft
 *   - Labor: 176.4 sqft × $4/sqft = $705.60
 *   - Materials: (flooring cost + pad + transitions)
 * 
 * Page 3: Signature
 *   - Customer signature line
 *   - Audit trail (version, updatedAt, updatedBy)
 */


// ============================================================================
// PART 7: SYNC TO iOS GRDB
// ============================================================================

/**
 * When iOS app periodically syncs with Firestore (e.g., after saving),
 * the GeometryData is mapped and stored locally:
 * 
 * GRDBStore.upsertGeometry(geometry):
 *   - Encodes geometry as JSON blob
 *   - UPSERTs into geometry table:
 *     {
 *       id: "geo-uuid",
 *       roomId: "room-123",
 *       jobId: "job-456",
 *       workspaceId: "workspace-789",
 *       data: "{...JSON...}",
 *       updatedAt: 1704067200
 *     }
 *   
 * Later, when offline, user can view/edit geometry from local GRDB.
 * On reconnect, iOS sends back any local changes for Firestore merge.
 */


// ============================================================================
// PART 8: COMPLETE EXAMPLE FLOW
// ============================================================================

/**
 * Timeline of events for a single room measurement:
 * 
 * T0:00  User opens job on iPad, selects room "Living Room"
 * T0:05  Taps point 1: (10, 5)  → snaps to grid, creates Point + (auto-segment if P>1)
 * T0:10  Taps point 2: (30, 5)  → snaps to wall, creates Point + Segment
 * T0:15  Taps point 3: (30, 15) → creates Point + Segment
 * T0:20  Taps point 4: (20, 18) → creates Point + Segment
 * T0:25  Taps point 5: (10, 12) → creates Point + Segment
 * 
 * T0:30  Undoes last point (T0:25) → removes Point 5 + Segment
 * T0:35  Re-does point (T0:25) → re-adds Point 5 + Segment
 * 
 * T0:40  Taps "Close Room" → creates closing Segment, computes area/perimeter
 *        - Geometry.closedPolygon = true
 *        - Perimeter = 45.2 feet
 *        - Area = 176.4 sqft
 * 
 * T0:45  Taps "Save" → exports GeometryExport, POSTs to /api/geometry/room-123
 * 
 * T0:50  Backend receives POST, stores to:
 *        jobs/job-456/rooms/room-123/geometry/current
 * 
 * T0:55  Web page (open in browser) receives Firestore snapshot
 *        - Renders room outline
 *        - Displays "176 sqft" area badge
 * 
 * T1:00  User taps "Generate Estimate" on web
 *        - PDF renderer reads geometry from Firestore
 *        - Renders floor plan page (with room polygon)
 *        - Renders takeoff page (area × rate calculations)
 *        - User signs and saves PDF
 * 
 * T1:05  iOS app syncs with Firestore
 *        - Downloads latest geometry + lineItems
 *        - Stores to local GRDB database
 *        - Now available offline
 */


// ============================================================================
// PART 9: ERROR RECOVERY EXAMPLES
// ============================================================================

/**
 * Scenario 1: User tries to place point too close to existing point
 * 
 * Action:
 *   GeometryValidator.validatePointPlacement(x, y, geometry)
 *   returns: { code: "duplicate_point", severity: "warning" }
 * 
 * Response:
 *   Toast: "Point already exists at (30.1, 5.0)"
 *   UI: Point placement is rejected, no state change
 */

/**
 * Scenario 2: User creates self-intersecting wall
 * 
 * Action:
 *   GeometryValidator.validateSegmentCreation(p1Id, p2Id, geometry)
 *   detects: newSegment intersects existing segment
 *   returns: { code: "self_intersecting", severity: "error" }
 * 
 * Response:
 *   Toast: "Segment would intersect with existing wall"
 *   UI: Segment creation is rejected
 */

/**
 * Scenario 3: User tries to close polygon with < 3 points
 * 
 * Action:
 *   GeometryValidator.validatePolygonClosure(geometry)
 *   checks: geometry.points.length >= 3
 *   returns: { code: "insufficient_points", severity: "error" }
 * 
 * Response:
 *   Toast: "Polygon needs at least 3 points, have 2"
 *   UI: "Close Room" button stays disabled
 */

/**
 * Scenario 4: Offline save attempt on iOS
 * 
 * Action:
 *   POST to /api/geometry/room-123 fails (no network)
 *   Error: { domain: "NSURLErrorDomain", code: -1009 }
 * 
 * Response:
 *   Toast: "Save failed: Network unreachable"
 *   UI: Geometry remains in local GRDB with pending_sync = true
 *   Auto-retry: When network returns, POST is queued and retried
 */


// ============================================================================
// SUMMARY
// ============================================================================

/**
 * Geometry Engine: Complete Data Flow
 * 
 * iPad Input (SwiftUI)
 *   ↓ (tap → pixels → feet)
 * SnapRulesEngine
 *   ↓ (snap to grid/wall/angle)
 * GeometryEngine
 *   ↓ (create Point, auto-segment, validate, record undo)
 * GeometryData
 *   ↓ (close polygon, compute area/perimeter)
 * GeometryValidator
 *   ↓ (topology check, perimeter check)
 * GeometryExport
 *   ↓ (POST to /api/geometry/roomId)
 * Firestore
 *   ↓ (jobs/{jobId}/rooms/{roomId}/geometry/current)
 * Web Real-time Listener (React)
 *   ↓ (onSnapshot → setGeometry)
 * GeometryCanvas
 *   ↓ (render points, segments, labels)
 * Browser Display
 *   ↓
 * PDF Generator
 *   ↓ (geometry → floor plan page)
 * Estimate PDF
 * 
 * Plus: GRDB offline sync on iOS, undo/redo stack, layer management
 * 
 * ---
 * 
 * Key Decisions:
 * • Snap threshold: 24 pixels (roughly 0.6 feet at 40px/ft)
 * • Grid size: 0.5 feet (6 inches) — standard in flooring
 * • Min perimeter: 20 feet — filters noise, very small sketches
 * • Max undo frames: 50 — balance between memory and usability
 * • Coordinates: Always in feet — matches flooring industry standard
 * 
 * Next Steps After Geometry Locked:
 * 1. Bluetooth: Feed Leica/Bosch distance measurements into geometry capture
 * 2. Roll Cut: Use geometry + products to optimize seam layout
 * 3. Migration: Convert Phase 1 laser measurements → Phase 2 geometry points
 * 4. PDF Rendering: Implement floor plan page (geometry → PDFKit graphics)
 */
