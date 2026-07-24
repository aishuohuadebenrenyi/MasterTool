import XCTest

final class ImprovToolIOSUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testAppLaunchesToPrimaryTrainingEntry() {
        let app = XCUIApplication()
        app.launch()

        XCTAssertTrue(app.buttons["home.startTraining"].waitForExistence(timeout: 5))
    }
}
