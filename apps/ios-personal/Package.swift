// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "ImprovToolIOS",
    platforms: [.iOS(.v16), .macOS(.v13)],
    products: [
        .library(name: "ImprovToolCore", targets: ["ImprovToolCore"])
    ],
    targets: [
        .target(name: "ImprovToolCore", path: "Sources/ImprovToolCore"),
        .testTarget(name: "ImprovToolCoreTests", dependencies: ["ImprovToolCore"], path: "Tests/ImprovToolCoreTests")
    ]
)
