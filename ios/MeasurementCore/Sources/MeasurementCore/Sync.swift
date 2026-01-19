import Foundation

public struct SyncEnvelope<T: Codable>: Codable {
    public let payload: T
    public let updatedAt: Date
    public let updatedBy: String
    public init(payload: T, updatedAt: Date, updatedBy: String) {
        self.payload = payload
        self.updatedAt = updatedAt
        self.updatedBy = updatedBy
    }
}

public struct ChangeToken: Codable, Equatable {
    public let collection: String
    public let cursor: String
}

public protocol SyncService {
    func push<T: Codable>(_ items: [SyncEnvelope<T>], to collection: String) async throws
    func pull(from collection: String, since token: ChangeToken?) async throws -> (items: [Data], next: ChangeToken?)
}

public enum SyncError: Error {
    case network
    case conflict
    case unauthorized
    case storage
}
