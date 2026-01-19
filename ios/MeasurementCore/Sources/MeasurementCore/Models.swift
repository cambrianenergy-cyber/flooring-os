import Foundation

// Core IDs are deterministic (UUID v4 generated client-side)
public struct Ident: Hashable, Codable {
    public let raw: String
    public init(_ raw: String) { self.raw = raw }
}

public struct Customer: Codable {
    public let id: Ident
    public let workspaceId: String
    public var name: String
    public var contacts: [Contact]
    public var addresses: [Address]
    public var createdAt: Date
    public var updatedAt: Date
}

public struct Job: Codable {
    public let id: Ident
    public let workspaceId: String
    public let customerId: Ident
    public var title: String
    public var propertyAddress: Address
    public var status: String
    public var schedule: Schedule?
    public var assignedCrew: [String]
    public var createdAt: Date
    public var updatedAt: Date
}

public struct Room: Codable {
    public let id: Ident
    public let jobId: Ident
    public var name: String
    public var status: String
    public var areaSqFt: Double?
    public var ceilingHeight: Double?
    public var tags: [String]
    public var updatedAt: Date
}

public struct Geometry: Codable {
    public enum Mode: String, Codable { case points, numbers }
    public struct Point: Codable, Hashable { public let id: Ident; public var x, y, z: Double?; public var seq: Int }
    public struct Segment: Codable, Hashable {
        public let id: Ident
        public var startPointId: Ident
        public var endPointId: Ident
        public var length: Double?
        public var angle: Double?
        public var wallLabel: String?
        public var fromLaser: Bool
    }
    public struct Label: Codable, Hashable { public let id: Ident; public var text: String; public var pointId: Ident?; public var segmentId: Ident? }

    public var mode: Mode
    public var points: [Point]
    public var segments: [Segment]
    public var labels: [Label]
    public var version: Int
    public var updatedAt: Date
    public var updatedBy: String
}

public struct Measurement: Codable {
    public enum CaptureMode: String, Codable { case single, walk }
    public enum Source: String, Codable { case laser, manual }
    public let id: Ident
    public let roomId: Ident
    public let segmentId: Ident?
    public let deviceId: String
    public let timestamp: Date
    public var captureMode: CaptureMode
    public var reading: Reading
    public var userId: String
    public var source: Source
    public var qualityFlags: [String]

    public struct Reading: Codable {
        public var length: Double?
        public var angle: Double?
        public var tilt: Double?
    }
}

public struct Photo: Codable {
    public let id: Ident
    public let roomId: Ident
    public let jobId: Ident
    public var localUri: URL
    public var remoteUri: URL?
    public var annotations: [Annotation]
    public var capturedAt: Date
    public var userId: String
    public var deviceId: String

    public struct Annotation: Codable { public var text: String; public var x: Double; public var y: Double }
}

public struct Estimate: Codable {
    public let id: Ident
    public let jobId: Ident
    public var status: String
    public var totals: Totals
    public var taxRate: Double
    public var version: Int
    public var priceBookId: Ident?
    public var updatedAt: Date
}

public struct LineItem: Codable {
    public let id: Ident
    public let estimateId: Ident
    public let productId: Ident
    public var qty: Double
    public var waste: Double?
    public var priceOverride: Double?
    public var roomRefs: [Ident]
    public var notes: String?
}

public struct Product: Codable {
    public let id: Ident
    public let workspaceId: String
    public var sku: String?
    public var name: String
    public var category: String?
    public var materialType: String?
    public var uom: String?
    public var cost: Double?
    public var price: Double?
    public var vendor: String?
    public var tags: [String]
    public var archived: Bool
    public var updatedAt: Date
}

public struct PriceBook: Codable {
    public let id: Ident
    public let workspaceId: String
    public var name: String
    public var effectiveFrom: Date?
    public var rules: [PriceRule]
    public var updatedAt: Date
}

public struct PriceRule: Codable {
    public var name: String
    public var category: String?
    public var materialType: String?
    public var laborRate: Double?
    public var materialMarkup: Double?
    public var addon: Double?
}

public struct Totals: Codable {
    public var material: Double
    public var labor: Double
    public var addons: Double
    public var tax: Double
    public var grand: Double
}

public struct AuditLog: Codable {
    public let id: Ident
    public let workspaceId: String
    public let jobId: Ident?
    public let roomId: Ident?
    public let segmentId: Ident?
    public let action: String
    public let actorId: String
    public let deviceId: String
    public let timestamp: Date
    public let summary: String?
}

public struct Contact: Codable { public var name: String; public var email: String?; public var phone: String? }
public struct Address: Codable { public var line1: String; public var city: String; public var state: String; public var postal: String? }
public struct Schedule: Codable { public var start: Date?; public var end: Date? }

// Sync markers
public struct SyncState: Codable { public var updatedAt: Date; public var updatedBy: String }
