/**
 * GeometryEngine.swift - Core spatial algorithms for room layout
 * 
 * Responsible for:
 * - Adding points with snap-to-grid/wall logic
 * - Creating segments and validating topology
 * - Computing perimeter & area
 * - Detecting closed polygons
 * - Exporting to JSON for Firestore/PDF
 */

import Foundation

struct GeometryEngine {
    var geometry: GeometryData
    private(set) var undoStack: [UndoFrame] = []
    private(set) var redoStack: [UndoFrame] = []
    
    // MARK: - Initialization
    
    init(geometry: GeometryData = GeometryData()) {
        self.geometry = geometry
    }
    
    // MARK: - Point Operations
    
    /// Add a point to the geometry with snapping rules applied
    /// - Parameters:
    ///   - x: X coordinate in feet
    ///   - y: Y coordinate in feet
    ///   - snapRules: Snap rules engine for determining final position
    /// - Returns: The created Point (may be snapped to nearby grid/wall)
    mutating func addPoint(
        x: Double,
        y: Double,
        snapRules: SnapRulesEngine
    ) throws -> Point {
        // Apply snapping
        let snapResult = snapRules.evaluate(x: x, y: y, against: geometry)
        
        let point = Point(
            id: UUID().uuidString,
            x: snapResult.x,
            y: snapResult.y,
            timestamp: Date().timeIntervalSince1970
        )
        
        // Add to geometry
        geometry.points.append(point)
        geometry.version += 1
        geometry.updatedAt = Date().timeIntervalSince1970
        
        // Record undo frame
        recordUndo(
            operation: .addPoint(point: point),
            description: "Add point at (\(String(format: "%.1f", point.x)), \(String(format: "%.1f", point.y)))"
        )
        
        return point
    }
    
    /// Move an existing point to a new location
    mutating func movePoint(
        pointId: String,
        to x: Double,
        to y: Double,
        snapRules: SnapRulesEngine
    ) throws -> Point {
        guard let index = geometry.points.firstIndex(where: { $0.id == pointId }) else {
            throw GeometryError.pointNotFound(pointId)
        }
        
        let oldPoint = geometry.points[index]
        let snapResult = snapRules.evaluate(x: x, y: y, against: geometry)
        
        var updatedPoint = oldPoint
        updatedPoint.x = snapResult.x
        updatedPoint.y = snapResult.y
        updatedPoint.timestamp = Date().timeIntervalSince1970
        
        geometry.points[index] = updatedPoint
        geometry.version += 1
        geometry.updatedAt = Date().timeIntervalSince1970
        
        recordUndo(
            operation: .movePoint(
                pointId: pointId,
                oldX: oldPoint.x,
                oldY: oldPoint.y,
                newX: updatedPoint.x,
                newY: updatedPoint.y
            ),
            description: "Move point to (\(String(format: "%.1f", updatedPoint.x)), \(String(format: "%.1f", updatedPoint.y)))"
        )
        
        return updatedPoint
    }
    
    /// Remove a point and all segments connected to it
    mutating func removePoint(pointId: String) throws {
        guard geometry.points.contains(where: { $0.id == pointId }) else {
            throw GeometryError.pointNotFound(pointId)
        }
        
        // Remove segments connected to this point
        let connectedSegments = geometry.segments.filter { $0.p1Id == pointId || $0.p2Id == pointId }
        geometry.segments.removeAll { $0.p1Id == pointId || $0.p2Id == pointId }
        
        // Remove point
        geometry.points.removeAll { $0.id == pointId }
        geometry.version += 1
        geometry.updatedAt = Date().timeIntervalSince1970
        
        recordUndo(
            operation: .removePoint(pointId: pointId),
            description: "Remove point and \(connectedSegments.count) connected segments"
        )
    }
    
    // MARK: - Segment Operations
    
    /// Connect two points with a segment
    mutating func addSegment(
        from p1Id: String,
        to p2Id: String,
        type: SegmentType = .wall
    ) throws -> Segment {
        guard geometry.points.contains(where: { $0.id == p1Id }) else {
            throw GeometryError.pointNotFound(p1Id)
        }
        guard geometry.points.contains(where: { $0.id == p2Id }) else {
            throw GeometryError.pointNotFound(p2Id)
        }
        guard p1Id != p2Id else {
            throw GeometryError.cannotConnectPointToSelf
        }
        
        let p1 = geometry.points.first { $0.id == p1Id }!
        let p2 = geometry.points.first { $0.id == p2Id }!
        
        let length = distance(p1: p1, p2: p2)
        guard length >= GEOMETRY_DEFAULTS.MINIMUM_SEGMENT_LENGTH else {
            throw GeometryError.segmentTooShort(length)
        }
        
        let angle = bearing(from: p1, to: p2)
        
        let segment = Segment(
            id: UUID().uuidString,
            p1Id: p1Id,
            p2Id: p2Id,
            type: type,
            length: length,
            angle: angle,
            timestamp: Date().timeIntervalSince1970
        )
        
        geometry.segments.append(segment)
        geometry.version += 1
        geometry.updatedAt = Date().timeIntervalSince1970
        
        recordUndo(
            operation: .addSegment(segment: segment),
            description: "Add \(type.rawValue) segment (\(String(format: "%.1f", length)) ft)"
        )
        
        return segment
    }
    
    /// Remove a segment
    mutating func removeSegment(segmentId: String) throws {
        guard geometry.segments.contains(where: { $0.id == segmentId }) else {
            throw GeometryError.segmentNotFound(segmentId)
        }
        
        geometry.segments.removeAll { $0.id == segmentId }
        geometry.version += 1
        geometry.updatedAt = Date().timeIntervalSince1970
        
        recordUndo(
            operation: .removeSegment(segmentId: segmentId),
            description: "Remove segment"
        )
    }
    
    // MARK: - Polygon Operations
    
    /// Attempt to close the polygon by connecting the last point to the first
    /// - Returns: The closing segment if successful
    mutating func closePolygon() throws -> Segment? {
        guard geometry.points.count >= 3 else {
            throw GeometryError.insufficientPointsForPolygon(geometry.points.count)
        }
        
        let firstPoint = geometry.points[0]
        let lastPoint = geometry.points[geometry.points.count - 1]
        
        // Check if already closed
        let alreadyClosed = geometry.segments.contains { segment in
            (segment.p1Id == firstPoint.id && segment.p2Id == lastPoint.id) ||
            (segment.p1Id == lastPoint.id && segment.p2Id == firstPoint.id)
        }
        
        if alreadyClosed {
            geometry.closedPolygon = true
            return nil
        }
        
        // Create closing segment
        let closingSegment = try addSegment(from: lastPoint.id, to: firstPoint.id, type: .wall)
        geometry.closedPolygon = true
        
        return closingSegment
    }
    
    // MARK: - Computation
    
    /// Compute perimeter of all segments in feet
    func computePerimeter() -> Double {
        geometry.segments.reduce(0) { $0 + ($1.length ?? 0) }
    }
    
    /// Compute area of closed polygon using Shoelace formula
    /// Returns 0 if polygon not closed
    func computeArea() -> Double {
        guard geometry.closedPolygon else { return 0 }
        guard geometry.points.count >= 3 else { return 0 }
        
        // Order points by polygon connectivity
        let orderedPoints = orderedPolygonPoints()
        guard orderedPoints.count >= 3 else { return 0 }
        
        var area: Double = 0
        for i in 0..<orderedPoints.count {
            let p1 = orderedPoints[i]
            let p2 = orderedPoints[(i + 1) % orderedPoints.count]
            area += p1.x * p2.y
            area -= p2.x * p1.y
        }
        
        return abs(area) / 2.0
    }
    
    /// Get centroid (center of mass) of polygon
    func computeCentroid() -> (x: Double, y: Double) {
        let orderedPoints = orderedPolygonPoints()
        guard orderedPoints.count >= 3 else {
            return (0, 0)
        }
        
        var cx: Double = 0
        var cy: Double = 0
        
        for i in 0..<orderedPoints.count {
            let p1 = orderedPoints[i]
            let p2 = orderedPoints[(i + 1) % orderedPoints.count]
            let factor = (p1.x * p2.y - p2.x * p1.y)
            cx += (p1.x + p2.x) * factor
            cy += (p1.y + p2.y) * factor
        }
        
        let area = computeArea()
        guard area != 0 else { return (0, 0) }
        
        return (cx / (6 * area), cy / (6 * area))
    }
    
    /// Get bounds of geometry
    func computeBounds() -> (minX: Double, maxX: Double, minY: Double, maxY: Double) {
        guard !geometry.points.isEmpty else {
            return (0, 0, 0, 0)
        }
        
        let xs = geometry.points.map { $0.x }
        let ys = geometry.points.map { $0.y }
        
        return (
            minX: xs.min() ?? 0,
            maxX: xs.max() ?? 0,
            minY: ys.min() ?? 0,
            maxY: ys.max() ?? 0
        )
    }
    
    // MARK: - Validation
    
    /// Validate the entire geometry for logical errors
    func validate() -> [ValidationError] {
        var errors: [ValidationError] = []
        
        // Check minimum points
        if geometry.points.count < 3 && geometry.closedPolygon {
            errors.append(ValidationError(
                code: "insufficient_points",
                severity: .error,
                message: "Polygon requires at least 3 points"
            ))
        }
        
        // Check minimum perimeter
        let perimeter = computePerimeter()
        if geometry.closedPolygon && perimeter < GEOMETRY_DEFAULTS.MINIMUM_PERIMETER {
            errors.append(ValidationError(
                code: "perimeter_too_small",
                severity: .error,
                message: "Perimeter (\(String(format: "%.1f", perimeter)) ft) is less than minimum \(GEOMETRY_DEFAULTS.MINIMUM_PERIMETER) ft"
            ))
        }
        
        // Check maximum area
        let area = computeArea()
        if area > GEOMETRY_DEFAULTS.MAXIMUM_AREA {
            errors.append(ValidationError(
                code: "area_too_large",
                severity: .error,
                message: "Area (\(String(format: "%.0f", area)) sqft) exceeds maximum"
            ))
        }
        
        // Check for self-intersecting segments
        for (i, segment1) in geometry.segments.enumerated() {
            for segment2 in geometry.segments[(i + 1)...] {
                if segmentsIntersect(segment1, segment2, in: geometry) {
                    errors.append(ValidationError(
                        code: "self_intersecting",
                        severity: .error,
                        message: "Segments intersect (invalid polygon)",
                        affectedIds: [segment1.id, segment2.id]
                    ))
                }
            }
        }
        
        return errors
    }
    
    // MARK: - Export
    
    /// Export geometry as ComputedGeometry with derived values
    func exportComputed() -> ComputedGeometry {
        let bounds = computeBounds()
        return ComputedGeometry(
            perimeter: computePerimeter(),
            area: computeArea(),
            validationErrors: validate(),
            isClosed: geometry.closedPolygon,
            bounds: bounds,
            centroid: computeCentroid()
        )
    }
    
    // MARK: - Undo/Redo
    
    mutating func undo() throws {
        guard !undoStack.isEmpty else {
            throw GeometryError.nothingToUndo
        }
        
        let frame = undoStack.removeLast()
        redoStack.append(frame)
        try applyUndoFrame(frame, reverse: true)
    }
    
    mutating func redo() throws {
        guard !redoStack.isEmpty else {
            throw GeometryError.nothingToRedo
        }
        
        let frame = redoStack.removeLast()
        undoStack.append(frame)
        try applyUndoFrame(frame, reverse: false)
    }
    
    private mutating func recordUndo(operation: GeometryOperation, description: String) {
        let frame = UndoFrame(
            id: UUID().uuidString,
            timestamp: Date().timeIntervalSince1970,
            operation: operation,
            description: description
        )
        undoStack.append(frame)
        
        // Trim undo stack if too large
        if undoStack.count > GEOMETRY_DEFAULTS.MAX_UNDO_FRAMES {
            undoStack.removeFirst()
        }
        
        // Clear redo stack on new operation
        redoStack.removeAll()
    }
    
    private mutating func applyUndoFrame(_ frame: UndoFrame, reverse: Bool) throws {
        switch frame.operation {
        case .addPoint(let point):
            if reverse {
                try removePoint(pointId: point.id)
            }
        case .removePoint(let pointId):
            if !reverse {
                try removePoint(pointId: pointId)
            }
        case .movePoint(let pointId, let oldX, let oldY, let newX, let newY):
            let target = reverse ? (x: oldX, y: oldY) : (x: newX, y: newY)
            try movePoint(pointId: pointId, to: target.x, to: target.y, snapRules: SnapRulesEngine(geometry: geometry))
        case .addSegment(let segment):
            if reverse {
                try removeSegment(segmentId: segment.id)
            }
        case .removeSegment(let segmentId):
            if !reverse {
                try removeSegment(segmentId: segmentId)
            }
        case .setLabel, .removeLabel:
            // Label operations not yet implemented
            break
        case .addConstraint:
            // Constraint operations not yet implemented
            break
        case .batch(let ops):
            for op in reverse ? ops.reversed() : ops {
                try applyUndoFrame(UndoFrame(id: UUID().uuidString, timestamp: Date().timeIntervalSince1970, operation: op, description: ""), reverse: reverse)
            }
        }
    }
    
    // MARK: - Private Helpers
    
    private func distance(p1: Point, p2: Point) -> Double {
        sqrt(pow(p2.x - p1.x, 2) + pow(p2.y - p1.y, 2))
    }
    
    private func bearing(from p1: Point, to p2: Point) -> Double {
        let dx = p2.x - p1.x
        let dy = p2.y - p1.y
        var angle = atan2(dy, dx) * 180 / .pi
        if angle < 0 { angle += 360 }
        return angle
    }
    
    private func orderedPolygonPoints() -> [Point] {
        // Simple polygon ordering: sort by angle from centroid
        let centroid = computeCentroid()
        return geometry.points.sorted { p1, p2 in
            let angle1 = atan2(p1.y - centroid.y, p1.x - centroid.x)
            let angle2 = atan2(p2.y - centroid.y, p2.x - centroid.x)
            return angle1 < angle2
        }
    }
    
    private func segmentsIntersect(_ s1: Segment, _ s2: Segment, in geo: GeometryData) -> Bool {
        guard let p1 = geo.points.first(where: { $0.id == s1.p1Id }),
              let p2 = geo.points.first(where: { $0.id == s1.p2Id }),
              let p3 = geo.points.first(where: { $0.id == s2.p1Id }),
              let p4 = geo.points.first(where: { $0.id == s2.p2Id }) else {
            return false
        }
        
        // Check if segments share endpoints
        if [s1.p1Id, s1.p2Id].contains(s2.p1Id) || [s1.p1Id, s1.p2Id].contains(s2.p2Id) {
            return false
        }
        
        // Line intersection check (ccw method)
        func ccw(a: Point, b: Point, c: Point) -> Bool {
            return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x)
        }
        
        return ccw(a: p1, b: p3, c: p4) != ccw(a: p2, b: p3, c: p4) &&
               ccw(a: p1, b: p2, c: p3) != ccw(a: p1, b: p2, c: p4)
    }
}

// MARK: - Types

enum SegmentType: String {
    case wall
    case door
    case window
    case opening
    case referenceLine = "reference-line"
}

enum GeometryError: LocalizedError {
    case pointNotFound(String)
    case segmentNotFound(String)
    case cannotConnectPointToSelf
    case segmentTooShort(Double)
    case insufficientPointsForPolygon(Int)
    case nothingToUndo
    case nothingToRedo
    
    var errorDescription: String? {
        switch self {
        case .pointNotFound(let id):
            return "Point not found: \(id)"
        case .segmentNotFound(let id):
            return "Segment not found: \(id)"
        case .cannotConnectPointToSelf:
            return "Cannot connect a point to itself"
        case .segmentTooShort(let length):
            return "Segment too short: \(String(format: "%.2f", length)) ft"
        case .insufficientPointsForPolygon(let count):
            return "Need at least 3 points for polygon, have \(count)"
        case .nothingToUndo:
            return "Nothing to undo"
        case .nothingToRedo:
            return "Nothing to redo"
        }
    }
}

// MARK: - Stubs for future use

struct Point: Codable {
    let id: String
    var x: Double
    var y: Double
    var z: Double? = nil
    var label: String? = nil
    let timestamp: TimeInterval
}

struct Segment: Codable {
    let id: String
    let p1Id: String
    let p2Id: String
    let type: SegmentType
    var length: Double? = nil
    var angle: Double? = nil
    var material: String? = nil
    var notes: String? = nil
    let timestamp: TimeInterval
}

struct GeometryData: Codable {
    var id: String
    var roomId: String
    var jobId: String
    var workspaceId: String
    var points: [Point]
    var segments: [Segment]
    var labels: [Label]
    var layers: [Layer]
    var constraints: [Constraint]
    var mode: String // "points" | "sketch" | "laser-legacy"
    var closedPolygon: Bool
    var perimeter: Double
    var area: Double
    var version: Int
    var updatedAt: TimeInterval
    var updatedBy: String
    var deviceOrientation: String? = nil
    var tags: [String]? = nil
    var notes: String? = nil
    var archived: Bool? = nil
    
    init() {
        self.id = UUID().uuidString
        self.roomId = ""
        self.jobId = ""
        self.workspaceId = ""
        self.points = []
        self.segments = []
        self.labels = []
        self.layers = []
        self.constraints = []
        self.mode = "points"
        self.closedPolygon = false
        self.perimeter = 0
        self.area = 0
        self.version = 0
        self.updatedAt = Date().timeIntervalSince1970
        self.updatedBy = "system"
    }
}

struct Label: Codable {
    let id: String
    let text: String
    let x: Double
    let y: Double
    let angle: Double?
    let fontSize: Int?
    let timestamp: TimeInterval
}

struct Layer: Codable {
    let id: String
    let name: String
    let visible: Bool
    let locked: Bool
    let opacity: Double?
    let color: String?
    let pointIds: [String]
    let segmentIds: [String]
}

struct Constraint: Codable {
    let id: String
    let type: String
    let targetId: String
    let metadata: [String: AnyCodable]?
}

struct AnyCodable: Codable {
    let value: AnySendable
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        self.value = .null
    }
    
    func encode(to encoder: Encoder) throws {}
}

enum AnySendable: Sendable {}

struct ComputedGeometry: Codable {
    let perimeter: Double
    let area: Double
    let validationErrors: [ValidationError]
    let isClosed: Bool
    let bounds: (minX: Double, maxX: Double, minY: Double, maxY: Double)
    let centroid: (x: Double, y: Double)
    
    enum CodingKeys: String, CodingKey {
        case perimeter, area, validationErrors, isClosed
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(perimeter, forKey: .perimeter)
        try container.encode(area, forKey: .area)
        try container.encode(validationErrors, forKey: .validationErrors)
        try container.encode(isClosed, forKey: .isClosed)
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.perimeter = try container.decode(Double.self, forKey: .perimeter)
        self.area = try container.decode(Double.self, forKey: .area)
        self.validationErrors = try container.decode([ValidationError].self, forKey: .validationErrors)
        self.isClosed = try container.decode(Bool.self, forKey: .isClosed)
        self.bounds = (0, 0, 0, 0)
        self.centroid = (0, 0)
    }
    
    init(perimeter: Double, area: Double, validationErrors: [ValidationError], isClosed: Bool, bounds: (minX: Double, maxX: Double, minY: Double, maxY: Double), centroid: (x: Double, y: Double)) {
        self.perimeter = perimeter
        self.area = area
        self.validationErrors = validationErrors
        self.isClosed = isClosed
        self.bounds = bounds
        self.centroid = centroid
    }
}

struct ValidationError: Codable {
    let code: String
    let severity: String // "error" | "warning"
    let message: String
    let affectedIds: [String]?
}

struct UndoFrame: Codable {
    let id: String
    let timestamp: TimeInterval
    let operation: GeometryOperation
    let description: String
}

enum GeometryOperation: Codable {
    case addPoint(point: Point)
    case removePoint(pointId: String)
    case movePoint(pointId: String, oldX: Double, oldY: Double, newX: Double, newY: Double)
    case addSegment(segment: Segment)
    case removeSegment(segmentId: String)
    case setLabel(label: Label)
    case removeLabel(labelId: String)
    case addConstraint(constraint: Constraint)
    case batch(ops: [GeometryOperation])
}

const let GEOMETRY_DEFAULTS = (
    GRID_SIZE: 0.5,
    SNAP_THRESHOLD_PIXELS: 24,
    MAGNETIC_EDGE_RADIUS: 12.0,
    MINIMUM_PERIMETER: 20.0,
    MINIMUM_SEGMENT_LENGTH: 1.0,
    MAXIMUM_AREA: 10000.0,
    PIXELS_PER_FOOT: 40,
    POINT_RADIUS_PIXELS: 8,
    LABEL_FONT_SIZE: 12,
    MAX_UNDO_FRAMES: 50
)

class SnapRulesEngine {
    let geometry: GeometryData
    
    init(geometry: GeometryData) {
        self.geometry = geometry
    }
    
    func evaluate(x: Double, y: Double, against geometry: GeometryData) -> SnapResult {
        return SnapResult(x: x, y: y, distance: 0)
    }
}

struct SnapResult: Codable {
    let x: Double
    let y: Double
    let snappedTo: String?
    let distance: Double
}
