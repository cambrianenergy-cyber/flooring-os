import Foundation

/// Device abstraction layer for measurement sources (Leica, Bosch, manual, etc.)
public protocol MeasurementDevice: AnyObject {
    var isConnected: Bool { get }
    var deviceName: String { get }
    
    /// Establish connection to device
    func connect(timeout: TimeInterval) async throws
    
    /// Close connection gracefully
    func disconnect() async throws
    
    /// Read distance measurement
    func readDistance() async throws -> Double // in feet
    
    /// Read angle measurement (if supported)
    func readAngle() async throws -> Double? // in degrees
    
    /// Stream live measurements (subscription pattern)
    func streamMeasurements() -> AsyncStream<MeasurementReading>
}

/// Single measurement reading from device
public struct MeasurementReading {
    public let distance: Double // feet
    public let angle: Double? // degrees
    public let tilt: Double? // pitch angle
    public let timestamp: Date
    public let accuracy: Float? // confidence 0.0-1.0
    
    public init(distance: Double, angle: Double? = nil, tilt: Double? = nil, timestamp: Date = Date(), accuracy: Float? = nil) {
        self.distance = distance
        self.angle = angle
        self.tilt = tilt
        self.timestamp = timestamp
        self.accuracy = accuracy
    }
}

/// Device connection state
public enum DeviceState {
    case disconnected
    case scanning
    case connecting
    case connected
    case error(String)
}

/// Leica Disto BLE device implementation
public final class LeicaDistoDevice: MeasurementDevice {
    public var deviceName: String { "Leica Disto" }
    
    private(set) public var isConnected = false
    private var simulatedReadings: AsyncStream<MeasurementReading>?
    
    public init() {}
    
    public func connect(timeout: TimeInterval) async throws {
        // Placeholder: actual implementation would use CoreBluetooth
        // BLE Service UUID: 0xFFF0 (Disto)
        // Distance characteristic: 0xFFF1 (read, notify)
        // Angle characteristic: 0xFFF2 (read, notify)
        isConnected = true
    }
    
    public func disconnect() async throws {
        isConnected = false
    }
    
    public func readDistance() async throws -> Double {
        // Placeholder: would read from BLE characteristic
        return 12.5 // feet
    }
    
    public func readAngle() async throws -> Double? {
        // Placeholder: would read from BLE characteristic
        return 45.0 // degrees
    }
    
    public func streamMeasurements() -> AsyncStream<MeasurementReading> {
        AsyncStream { continuation in
            // Placeholder: would subscribe to BLE notifications
            // For demo, emit a single reading
            continuation.yield(MeasurementReading(
                distance: 12.5,
                angle: 45.0,
                tilt: 5.0,
                timestamp: Date(),
                accuracy: 0.95
            ))
            continuation.finish()
        }
    }
}

/// Bosch GLM device implementation (future)
public final class BoschGLMDevice: MeasurementDevice {
    public var deviceName: String { "Bosch GLM" }
    
    private(set) public var isConnected = false
    
    public init() {}
    
    public func connect(timeout: TimeInterval) async throws {
        // BLE Service UUID: 0x180A (Bosch Device Info)
        // Distance characteristic: different UUID from Leica
        isConnected = true
    }
    
    public func disconnect() async throws {
        isConnected = false
    }
    
    public func readDistance() async throws -> Double {
        return 15.0
    }
    
    public func readAngle() async throws -> Double? {
        return nil // Bosch may not support angle
    }
    
    public func streamMeasurements() -> AsyncStream<MeasurementReading> {
        AsyncStream { continuation in
            continuation.yield(MeasurementReading(distance: 15.0))
            continuation.finish()
        }
    }
}

/// Manual input device (fallback, no hardware required)
public final class ManualInputDevice: MeasurementDevice {
    public var deviceName: String { "Manual Input" }
    public var isConnected: Bool { true }
    
    private var lastReading: MeasurementReading?
    
    public init() {}
    
    public func connect(timeout: TimeInterval) async throws {
        // No-op: manual always available
    }
    
    public func disconnect() async throws {
        // No-op
    }
    
    public func readDistance() async throws -> Double {
        lastReading?.distance ?? 0
    }
    
    public func readAngle() async throws -> Double? {
        lastReading?.angle
    }
    
    public func streamMeasurements() -> AsyncStream<MeasurementReading> {
        AsyncStream { _ in
            // User will provide input via UI
        }
    }
    
    /// Allow manual entry
    public func setReading(distance: Double, angle: Double? = nil) {
        lastReading = MeasurementReading(distance: distance, angle: angle, timestamp: Date())
    }
}

/// Device manager: scan, connect, and coordinate measurements
public final class MeasurementDeviceManager: NSObject {
    public var availableDevices: [MeasurementDevice] = []
    public var activeDevice: MeasurementDevice?
    
    public override init() {
        super.init()
        // Initialize with available device types
        availableDevices = [
            LeicaDistoDevice(),
            BoschGLMDevice(),
            ManualInputDevice()
        ]
    }
    
    public func scanForDevices(timeout: TimeInterval = 5.0) async throws -> [MeasurementDevice] {
        // Placeholder: would scan for BLE peripherals and return matching devices
        return availableDevices
    }
    
    public func connectToDevice(_ device: MeasurementDevice, timeout: TimeInterval = 10.0) async throws {
        try await device.connect(timeout: timeout)
        activeDevice = device
    }
    
    public func disconnectActiveDevice() async throws {
        if let device = activeDevice {
            try await device.disconnect()
            activeDevice = nil
        }
    }
}
