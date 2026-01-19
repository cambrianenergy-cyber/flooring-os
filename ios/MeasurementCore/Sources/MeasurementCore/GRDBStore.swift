import Foundation
import GRDB

// Lightweight GRDB store with JSON payload columns and simple secondary indexes.
public final class GRDBStore {
    public let dbQueue: DatabaseQueue

    public init(databaseURL: URL) throws {
        dbQueue = try DatabaseQueue(path: databaseURL.path)
        try migrator.migrate(dbQueue)
    }

    private var migrator: DatabaseMigrator {
        var migrator = DatabaseMigrator()
        migrator.registerMigration("v1_core") { db in
            try db.create(table: "jobs") { t in
                t.column("id", .text).notNull().primaryKey()
                t.column("workspaceId", .text).notNull()
                t.column("updatedAt", .double).notNull()
                t.column("blob", .blob).notNull()
            }
            try db.create(index: "idx_jobs_workspace", on: "jobs", columns: ["workspaceId", "updatedAt"], unique: false)

            try db.create(table: "rooms") { t in
                t.column("id", .text).notNull().primaryKey()
                t.column("jobId", .text).notNull()
                t.column("updatedAt", .double).notNull()
                t.column("blob", .blob).notNull()
            }
            try db.create(index: "idx_rooms_job", on: "rooms", columns: ["jobId", "updatedAt"], unique: false)

            try db.create(table: "geometry") { t in
                t.column("roomId", .text).notNull().primaryKey()
                t.column("updatedAt", .double).notNull()
                t.column("blob", .blob).notNull()
            }

            try db.create(table: "measurements") { t in
                t.column("id", .text).notNull().primaryKey()
                t.column("roomId", .text).notNull()
                t.column("timestamp", .double).notNull()
                t.column("blob", .blob).notNull()
            }
            try db.create(index: "idx_measurements_room", on: "measurements", columns: ["roomId", "timestamp"], unique: false)
            try db.create(table: "auditLogs") { t in
                t.column("id", .text).notNull().primaryKey()
                t.column("workspaceId", .text).notNull()
                t.column("jobId", .text)
                t.column("roomId", .text)
                t.column("segmentId", .text)
                t.column("timestamp", .double).notNull()
                t.column("blob", .blob).notNull()
            }
            try db.create(index: "idx_audit_workspace", on: "auditLogs", columns: ["workspaceId", "timestamp"], unique: false)

            try db.create(table: "products") { t in
                t.column("id", .text).notNull().primaryKey()
                t.column("workspaceId", .text).notNull()
                t.column("updatedAt", .double).notNull()
                t.column("blob", .blob).notNull()
            }
            try db.create(index: "idx_products_workspace", on: "products", columns: ["workspaceId", "updatedAt"], unique: false)

            try db.create(table: "priceBooks") { t in
                t.column("id", .text).notNull().primaryKey()
                t.column("workspaceId", .text).notNull()
                t.column("updatedAt", .double).notNull()
                t.column("blob", .blob).notNull()
            }
            try db.create(index: "idx_pricebooks_workspace", on: "priceBooks", columns: ["workspaceId", "updatedAt"], unique: false)

            try db.create(table: "estimates") { t in
                t.column("id", .text).notNull().primaryKey()
                t.column("jobId", .text).notNull()
                t.column("updatedAt", .double).notNull()
                t.column("blob", .blob).notNull()
            }
            try db.create(index: "idx_estimates_job", on: "estimates", columns: ["jobId", "updatedAt"], unique: false)

            try db.create(table: "lineItems") { t in
                t.column("id", .text).notNull().primaryKey()
                t.column("estimateId", .text).notNull()
                t.column("updatedAt", .double).notNull()
                t.column("blob", .blob).notNull()
            }
            try db.create(index: "idx_lineitems_estimate", on: "lineItems", columns: ["estimateId", "updatedAt"], unique: false)
        }
        return migrator
    }
}

// MARK: - Encoding helpers
private func encode<T: Codable>(_ value: T) throws -> Data {
    try JSONEncoder().encode(value)
}

private func decode<T: Codable>(_ data: Data, as type: T.Type) throws -> T {
    try JSONDecoder().decode(type, from: data)
}

// MARK: - GRDB-backed repositories
public final class GRDBJobsRepository: JobsRepository {
    private let store: GRDBStore
    private let clock: Clock
    public init(store: GRDBStore, clock: Clock = SystemClock()) { self.store = store; self.clock = clock }

    public func upsert(_ job: Job) async throws {
        try await store.dbQueue.write { db in
            try db.execute(sql: "REPLACE INTO jobs (id, workspaceId, updatedAt, blob) VALUES (?, ?, ?, ?)",
                           arguments: [job.id.raw, job.workspaceId, clock.now().timeIntervalSince1970, try encode(job)])
        }
    }

    public func fetchJobs(workspaceId: String) async throws -> [Job] {
        try await store.dbQueue.read { db in
            let rows = try Row.fetchAll(db, sql: "SELECT blob FROM jobs WHERE workspaceId = ? ORDER BY updatedAt DESC", arguments: [workspaceId])
            return try rows.map { try decode($0["blob"], as: Job.self) }
        }
    }

    public func fetchJob(id: Ident) async throws -> Job? {
        try await store.dbQueue.read { db in
            guard let row = try Row.fetchOne(db, sql: "SELECT blob FROM jobs WHERE id = ?", arguments: [id.raw]) else { return nil }
            return try decode(row["blob"], as: Job.self)
        }
    }
}

public final class GRDBRoomsRepository: RoomsRepository {
    private let store: GRDBStore
    private let clock: Clock
    public init(store: GRDBStore, clock: Clock = SystemClock()) { self.store = store; self.clock = clock }

    public func upsert(_ room: Room) async throws {
        try await store.dbQueue.write { db in
            try db.execute(sql: "REPLACE INTO rooms (id, jobId, updatedAt, blob) VALUES (?, ?, ?, ?)",
                           arguments: [room.id.raw, room.jobId.raw, clock.now().timeIntervalSince1970, try encode(room)])
        }
    }

    public func fetchRooms(jobId: Ident) async throws -> [Room] {
        try await store.dbQueue.read { db in
            let rows = try Row.fetchAll(db, sql: "SELECT blob FROM rooms WHERE jobId = ? ORDER BY updatedAt DESC", arguments: [jobId.raw])
            return try rows.map { try decode($0["blob"], as: Room.self) }
        }
    }
}

public final class GRDBGeometryRepository: GeometryRepository {
    private let store: GRDBStore
    private let clock: Clock
    public init(store: GRDBStore, clock: Clock = SystemClock()) { self.store = store; self.clock = clock }

    public func upsert(roomId: Ident, geometry: Geometry) async throws {
        try await store.dbQueue.write { db in
            try db.execute(sql: "REPLACE INTO geometry (roomId, updatedAt, blob) VALUES (?, ?, ?)",
                           arguments: [roomId.raw, clock.now().timeIntervalSince1970, try encode(geometry)])
        }
    }

    public func fetch(roomId: Ident) async throws -> Geometry? {
        try await store.dbQueue.read { db in
            guard let row = try Row.fetchOne(db, sql: "SELECT blob FROM geometry WHERE roomId = ?", arguments: [roomId.raw]) else { return nil }
            return try decode(row["blob"], as: Geometry.self)
        }
    }
}

public final class GRDBMeasurementsRepository: MeasurementsRepository {
    private let store: GRDBStore
    public init(store: GRDBStore) { self.store = store }

    public func append(_ measurement: Measurement) async throws {
        try await store.dbQueue.write { db in
            try db.execute(sql: "REPLACE INTO measurements (id, roomId, timestamp, blob) VALUES (?, ?, ?, ?)",
                           arguments: [measurement.id.raw, measurement.roomId.raw, measurement.timestamp.timeIntervalSince1970, try encode(measurement)])
        }
    }

    public func fetch(roomId: Ident, limit: Int) async throws -> [Measurement] {
        try await store.dbQueue.read { db in
            let rows = try Row.fetchAll(db, sql: "SELECT blob FROM measurements WHERE roomId = ? ORDER BY timestamp DESC LIMIT ?", arguments: [roomId.raw, limit])
            return try rows.map { try decode($0["blob"], as: Measurement.self) }
        }
    }
}

public final class GRDBProductsRepository: ProductsRepository {
    private let store: GRDBStore
    private let clock: Clock
    public init(store: GRDBStore, clock: Clock = SystemClock()) { self.store = store; self.clock = clock }

    public func upsert(_ product: Product) async throws {
        try await store.dbQueue.write { db in
            try db.execute(sql: "REPLACE INTO products (id, workspaceId, updatedAt, blob) VALUES (?, ?, ?, ?)",
                           arguments: [product.id.raw, product.workspaceId, clock.now().timeIntervalSince1970, try encode(product)])
        }
    }

    public func fetch(workspaceId: String) async throws -> [Product] {
        try await store.dbQueue.read { db in
            let rows = try Row.fetchAll(db, sql: "SELECT blob FROM products WHERE workspaceId = ? ORDER BY updatedAt DESC", arguments: [workspaceId])
            return try rows.map { try decode($0["blob"], as: Product.self) }
        }
    }
}

public final class GRDBPriceBooksRepository: PriceBooksRepository {
    private let store: GRDBStore
    private let clock: Clock
    public init(store: GRDBStore, clock: Clock = SystemClock()) { self.store = store; self.clock = clock }

    public func upsert(_ priceBook: PriceBook) async throws {
        try await store.dbQueue.write { db in
            try db.execute(sql: "REPLACE INTO priceBooks (id, workspaceId, updatedAt, blob) VALUES (?, ?, ?, ?)",
                           arguments: [priceBook.id.raw, priceBook.workspaceId, clock.now().timeIntervalSince1970, try encode(priceBook)])
        }
    }

    public func fetch(workspaceId: String) async throws -> [PriceBook] {
        try await store.dbQueue.read { db in
            let rows = try Row.fetchAll(db, sql: "SELECT blob FROM priceBooks WHERE workspaceId = ? ORDER BY updatedAt DESC", arguments: [workspaceId])
            return try rows.map { try decode($0["blob"], as: PriceBook.self) }
        }
    }
}

public final class GRDBEstimatesRepository: EstimatesRepository {
    private let store: GRDBStore
    private let clock: Clock
    public init(store: GRDBStore, clock: Clock = SystemClock()) { self.store = store; self.clock = clock }

    public func upsert(_ estimate: Estimate) async throws {
        try await store.dbQueue.write { db in
            try db.execute(sql: "REPLACE INTO estimates (id, jobId, updatedAt, blob) VALUES (?, ?, ?, ?)",
                           arguments: [estimate.id.raw, estimate.jobId.raw, clock.now().timeIntervalSince1970, try encode(estimate)])
        }
    }

    public func fetch(jobId: Ident) async throws -> [Estimate] {
        try await store.dbQueue.read { db in
            let rows = try Row.fetchAll(db, sql: "SELECT blob FROM estimates WHERE jobId = ? ORDER BY updatedAt DESC", arguments: [jobId.raw])
            return try rows.map { try decode($0["blob"], as: Estimate.self) }
        }
    }
}

public final class GRDBLineItemsRepository: LineItemsRepository {
    private let store: GRDBStore
    private let clock: Clock
    public init(store: GRDBStore, clock: Clock = SystemClock()) { self.store = store; self.clock = clock }

    public func upsert(_ lineItem: LineItem) async throws {
        try await store.dbQueue.write { db in
            try db.execute(sql: "REPLACE INTO lineItems (id, estimateId, updatedAt, blob) VALUES (?, ?, ?, ?)",
                           arguments: [lineItem.id.raw, lineItem.estimateId.raw, clock.now().timeIntervalSince1970, try encode(lineItem)])
        }
    }

    public func fetch(estimateId: Ident) async throws -> [LineItem] {
        try await store.dbQueue.read { db in
            let rows = try Row.fetchAll(db, sql: "SELECT blob FROM lineItems WHERE estimateId = ? ORDER BY updatedAt DESC", arguments: [estimateId.raw])
            return try rows.map { try decode($0["blob"], as: LineItem.self) }
        }
    }
}

public final class GRDBAuditRepository: AuditRepository {
    private let store: GRDBStore
    public init(store: GRDBStore) { self.store = store }

    public func append(_ log: AuditLog) async throws {
        try await store.dbQueue.write { db in
            try db.execute(sql: "REPLACE INTO auditLogs (id, workspaceId, jobId, roomId, segmentId, timestamp, blob) VALUES (?, ?, ?, ?, ?, ?, ?)",
                           arguments: [log.id.raw, log.workspaceId, log.jobId?.raw, log.roomId?.raw, log.segmentId?.raw, log.timestamp.timeIntervalSince1970, try encode(log)])
        }
    }
}
