const { wdi5 } = require("wdio-ui5-service");

// ─────────────────────────────────────────────────────────────────────────────
// wdio-ui5-service v0.9.x  uses  browser.goTo(), NOT wdi5.goTo()
// wdio-ui5-service v1.x+   uses  wdi5.goTo()
// We are on 0.9.16 so we always use  browser.goTo()
// ─────────────────────────────────────────────────────────────────────────────

describe("Testing home of test project", () => {

  // ── Setup: navigate to app root before the suite ──────────────────────────
  before(async () => {
    // In CI baseUrl = http://selenium:4444 is the hub, the actual app URL comes
    // from wdio.conf.js  baseUrl  (process.env.BASE_URL || http://localhost:8080)
    // browser.url() with a relative path is resolved against baseUrl automatically
    await browser.url("index.html");
    // Give UI5 bootstrap a moment to complete
    await browser.waitUntil(
      async () => {
        return await browser.execute(() => {
          return typeof sap !== "undefined" && sap.ui && sap.ui.getCore
            ? sap.ui.getCore().isInitialized()
            : false;
        });
      },
      { timeout: 15000, timeoutMsg: "UI5 did not initialise within 15s" }
    );
  });

  // ── Create screenshots directory if it doesn't exist ──────────────────────
  before(async () => {
    const fs = require("fs");
    const dir = "./webapp/test/__screenshots__";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP 1 – Page / title checks  (these PASS)
  // ─────────────────────────────────────────────────────────────────────────

  it("[PASS] should have title containing 'This is a test project for testing'", async () => {
    const title = await browser.getTitle();
    expect(title).toEqual("This is a test project for testing");
  });

  it("[PASS] should load the correct base URL", async () => {
    const url = await browser.getUrl();
    expect(url).toContain("index.html");
  });

  it("[PASS] should not have an empty page title", async () => {
    const title = await browser.getTitle();
    expect(title.length).toBeGreaterThan(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP 2 – Button checks  (these PASS)
  // ─────────────────────────────────────────────────────────────────────────

  it("[PASS] should have exactly one button in the App view", async () => {
    const btns = await browser.allControls({
      selector: {
        controlType: "sap.m.Button",
        viewName: "testingproject.view.App",
      },
    });
    expect(btns.length).toEqual(1);
  });

  it("[PASS] should display the correct button label", async () => {
    const btns = await browser.allControls({
      selector: {
        controlType: "sap.m.Button",
        viewName: "testingproject.view.App",
      },
    });
    const text = await btns[0].getText();
    expect(text).toEqual("Alle Bestellungen anzeigen");
  });

  it("[PASS] button should be enabled", async () => {
    const btns = await browser.allControls({
      selector: {
        controlType: "sap.m.Button",
        viewName: "testingproject.view.App",
      },
    });
    const enabled = await btns[0].getEnabled();
    expect(enabled).toBe(true);
  });

  it("[PASS] button should be visible", async () => {
    const btns = await browser.allControls({
      selector: {
        controlType: "sap.m.Button",
        viewName: "testingproject.view.App",
      },
    });
    const visible = await btns[0].getVisible();
    expect(visible).toBe(true);
  });

  it("[PASS] button text should not be empty", async () => {
    const btns = await browser.allControls({
      selector: {
        controlType: "sap.m.Button",
        viewName: "testingproject.view.App",
      },
    });
    const text = await btns[0].getText();
    expect(text.length).toBeGreaterThan(0);
  });

  it("[PASS] button should be pressable without throwing", async () => {
    const btns = await browser.allControls({
      selector: {
        controlType: "sap.m.Button",
        viewName: "testingproject.view.App",
      },
    });
    let threwError = false;
    try {
      await btns[0].press();
    } catch (e) {
      threwError = true;
    }
    expect(threwError).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP 3 – App shell  (these PASS)
  // ─────────────────────────────────────────────────────────────────────────

  it("[PASS] should render sap.m.App shell in the App view", async () => {
    const apps = await browser.allControls({
      selector: {
        controlType: "sap.m.App",
        viewName: "testingproject.view.App",
      },
    });
    expect(apps.length).toBeGreaterThanOrEqual(1);
  });

  it("[PASS] should have a sap.m.Page in the App view", async () => {
    const pages = await browser.allControls({
      selector: {
        controlType: "sap.m.Page",
        viewName: "testingproject.view.App",
      },
    });
    expect(pages.length).toBeGreaterThanOrEqual(1);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP 4 – Intentional FAILURE tests (to demonstrate failures in report)
  // ─────────────────────────────────────────────────────────────────────────

  it("[FAIL] button label should be in English (intentional failure)", async () => {
    const btns = await browser.allControls({
      selector: {
        controlType: "sap.m.Button",
        viewName: "testingproject.view.App",
      },
    });
    const text = await btns[0].getText();
    // The actual text is German – this assertion is intentionally wrong
    expect(text).toEqual("Show All Orders");
  });

  it("[FAIL] page title should match wrong value (intentional failure)", async () => {
    const title = await browser.getTitle();
    // Intentionally wrong expected value
    expect(title).toEqual("Wrong Title That Does Not Match");
  });

  it("[FAIL] there should be two buttons (intentional failure)", async () => {
    const btns = await browser.allControls({
      selector: {
        controlType: "sap.m.Button",
        viewName: "testingproject.view.App",
      },
    });
    // There is only 1 button – this intentionally expects 2
    expect(btns.length).toEqual(2);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Teardown: screenshot on suite end
  // ─────────────────────────────────────────────────────────────────────────
  after(async () => {
    try {
      await browser.saveScreenshot("./webapp/test/__screenshots__/home-final.png");
    } catch (e) {
      console.warn("Screenshot failed (non-fatal):", e.message);
    }
  });
});