import Foundation

public protocol Clock {
    func now() -> Date
}

public final class SystemClock: Clock {
    public init() {}
    public func now() -> Date { Date() }
}

// Simple repository interfaces (implement with Core Data/GRDB in app target)
public protocol JobsRepository {
    func upsert(_ job: Job) async throws
    func fetchJobs(workspaceId: String) async throws -> [Job]
    func fetchJob(id: Ident) async throws -> Job?
}

public protocol RoomsRepository {
    func upsert(_ room: Room) async throws
    func fetchRooms(jobId: Ident) async throws -> [Room]
}

public protocol GeometryRepository {
    func upsert(roomId: Ident, geometry: Geometry) async throws
    func fetch(roomId: Ident) async throws -> Geometry?
}

public protocol MeasurementsRepository {
    func append(_ measurement: Measurement) async throws
    func fetch(roomId: Ident, limit: Int) async throws -> [Measurement]
}

public protocol PhotosRepository {
    func add(_ photo: Photo) async throws
    func fetch(roomId: Ident, limit: Int) async throws -> [Photo]
}

public protocol EstimatesRepository {
    func upsert(_ estimate: Estimate) async throws
    func fetch(jobId: Ident) async throws -> [Estimate]
}

public protocol LineItemsRepository {
    func upsert(_ lineItem: LineItem) async throws
    func fetch(estimateId: Ident) async throws -> [LineItem]
}

public protocol ProductsRepository {
    func upsert(_ product: Product) async throws
    func fetch(workspaceId: String) async throws -> [Product]
}

public protocol PriceBooksRepository {
    func upsert(_ priceBook: PriceBook) async throws
    func fetch(workspaceId: String) async throws -> [PriceBook]
}

public protocol AuditRepository {
    func append(_ log: AuditLog) async throws
}
