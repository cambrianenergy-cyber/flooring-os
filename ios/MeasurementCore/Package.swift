// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MeasurementCore",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(name: "MeasurementCore", targets: ["MeasurementCore"])
    ],
    dependencies: [
        .package(url: "https://github.com/groue/GRDB.swift.git", from: "6.24.0")
    ],
    targets: [
        .target(name: "MeasurementCore", dependencies: [
            .product(name: "GRDB", package: "GRDB.swift")
        ]),
        .testTarget(name: "MeasurementCoreTests", dependencies: ["MeasurementCore"])
    ]
)
