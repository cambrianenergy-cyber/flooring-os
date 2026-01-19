import XCTest
@testable import MeasurementCore

final class GRDBStoreTests: XCTestCase {
    private func tempURL() -> URL {
        let dir = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(UUID().uuidString)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir.appendingPathComponent("test.sqlite")
    }

    func testMigrationAndCRUD() throws {
        let url = tempURL()
        let store = try GRDBStore(databaseURL: url)

        let clock = FixedClock(date: Date(timeIntervalSince1970: 1_700_000_000))

        let jobs = GRDBJobsRepository(store: store, clock: clock)
        let rooms = GRDBRoomsRepository(store: store, clock: clock)
        let geometryRepo = GRDBGeometryRepository(store: store, clock: clock)
        let measurements = GRDBMeasurementsRepository(store: store)
        let products = GRDBProductsRepository(store: store, clock: clock)
        let priceBooks = GRDBPriceBooksRepository(store: store, clock: clock)
        let estimates = GRDBEstimatesRepository(store: store, clock: clock)
        let lineItems = GRDBLineItemsRepository(store: store, clock: clock)

        let job = Job(
            id: Ident("job-1"),
            workspaceId: "ws-1",
            customerId: Ident("cust-1"),
            title: "Test Job",
            propertyAddress: Address(line1: "123 St", city: "", state: "", postal: nil),
            status: "active",
            schedule: nil,
            assignedCrew: [],
            createdAt: clock.now(),
            updatedAt: clock.now()
        )

        try awaitResult(jobs.upsert(job))
        let fetchedJob = try awaitResult(jobs.fetchJob(id: job.id))
        XCTAssertEqual(fetchedJob?.id.raw, job.id.raw)

        let room = Room(id: Ident("room-1"), jobId: job.id, name: "Room", status: "Pending", areaSqFt: nil, ceilingHeight: nil, tags: [], updatedAt: clock.now())
        try awaitResult(rooms.upsert(room))
        let fetchedRooms = try awaitResult(rooms.fetchRooms(jobId: job.id))
        XCTAssertEqual(fetchedRooms.count, 1)

        let geometry = Geometry(mode: .points, points: [], segments: [], labels: [], version: 1, updatedAt: clock.now(), updatedBy: "user")
        try awaitResult(geometryRepo.upsert(roomId: room.id, geometry: geometry))
        let fetchedGeom = try awaitResult(geometryRepo.fetch(roomId: room.id))
        XCTAssertEqual(fetchedGeom?.version, 1)

        let measurement = Measurement(id: Ident("meas-1"), roomId: room.id, segmentId: nil, deviceId: "dev", timestamp: clock.now(), captureMode: .single, reading: .init(length: 10, angle: nil, tilt: nil), userId: "u", source: .laser, qualityFlags: [])
        try awaitResult(measurements.append(measurement))
        let fetchedMeas = try awaitResult(measurements.fetch(roomId: room.id, limit: 10))
        XCTAssertEqual(fetchedMeas.count, 1)

        let product = Product(id: Ident("prod-1"), workspaceId: job.workspaceId, sku: "SKU", name: "Prod", category: "Cat", materialType: "Mat", uom: "ft2", cost: 1, price: 2, vendor: "Vend", tags: ["t"], archived: false, updatedAt: clock.now())
        try awaitResult(products.upsert(product))
        let fetchedProducts = try awaitResult(products.fetch(workspaceId: job.workspaceId))
        XCTAssertEqual(fetchedProducts.count, 1)

        let priceBook = PriceBook(id: Ident("pb-1"), workspaceId: job.workspaceId, name: "Standard", effectiveFrom: clock.now(), rules: [PriceRule(name: "Rule", category: nil, materialType: nil, laborRate: 1, materialMarkup: 0.1, addon: nil)], updatedAt: clock.now())
        try awaitResult(priceBooks.upsert(priceBook))
        let fetchedPB = try awaitResult(priceBooks.fetch(workspaceId: job.workspaceId))
        XCTAssertEqual(fetchedPB.count, 1)

        let estimate = Estimate(id: Ident("est-1"), jobId: job.id, status: "draft", totals: Totals(material: 0, labor: 0, addons: 0, tax: 0, grand: 0), taxRate: 0.08, version: 1, priceBookId: priceBook.id, updatedAt: clock.now())
        try awaitResult(estimates.upsert(estimate))
        let fetchedEst = try awaitResult(estimates.fetch(jobId: job.id))
        XCTAssertEqual(fetchedEst.count, 1)

        let lineItem = LineItem(id: Ident("li-1"), estimateId: estimate.id, productId: product.id, qty: 100, waste: 5, priceOverride: nil, roomRefs: [room.id], notes: nil)
        try awaitResult(lineItems.upsert(lineItem))
        let fetchedLi = try awaitResult(lineItems.fetch(estimateId: estimate.id))
        XCTAssertEqual(fetchedLi.count, 1)
    }
}

// Helpers
private struct FixedClock: Clock {
    let date: Date
    func now() -> Date { date }
}

@discardableResult
private func awaitResult<T>(_ expression: @autoclosure () async throws -> T, file: StaticString = #filePath, line: UInt = #line) throws -> T {
    var result: Result<T, Error>!
    let exp = XCTestExpectation(description: "awaitResult")
    Task {
        do { result = .success(try await expression()) }
        catch { result = .failure(error) }
        exp.fulfill()
    }
    let waiter = XCTWaiter()
    let res = waiter.wait(for: [exp], timeout: 2.0)
    if res != .completed {
        XCTFail("Timeout", file: file, line: line)
    }
    switch result! {
    case .success(let value): return value
    case .failure(let error): throw error
    }
}
