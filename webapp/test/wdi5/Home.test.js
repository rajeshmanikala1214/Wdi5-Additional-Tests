/**
 * Home.test.js
 *
 * wdio-ui5-service v0.9.x  →  use browser.url() + browser.waitUntil()
 *                              NOT wdi5.goTo()  (that's v1.x API)
 */

describe("Testing home of test project", () => {

  // ── Setup ──────────────────────────────────────────────────────────────────
  before(async () => {
    // Ensure screenshot dir exists (avoids "directory doesn't exist" error)
    const fs  = require("fs");
    const dir = "./webapp/test/__screenshots__";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  before(async () => {
    // browser.url() with a relative path is resolved against wdio.conf.js baseUrl
    // baseUrl = process.env.BASE_URL || "http://localhost:8080"
    await browser.url("index.html");

    // Wait for UI5 to finish bootstrapping
    await browser.waitUntil(
      async () => {
        return await browser.execute(() => {
          try {
            return typeof sap !== "undefined" &&
                   sap.ui &&
                   typeof sap.ui.getCore === "function" &&
                   sap.ui.getCore().isInitialized();
          } catch (e) {
            return false;
          }
        });
      },
      {
        timeout:    15000,
        interval:   500,
        timeoutMsg: "UI5 did not finish bootstrapping within 15s",
      }
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP 1 – Page-level checks  ✓ PASS
  // ─────────────────────────────────────────────────────────────────────────

  it("[PASS-01] page title should equal 'This is a test project for testing'", async () => {
    const title = await browser.getTitle();
    expect(title).toEqual("This is a test project for testing");
  });

  it("[PASS-02] page URL should contain 'index.html'", async () => {
    const url = await browser.getUrl();
    expect(url).toContain("index.html");
  });

  it("[PASS-03] page title should not be an empty string", async () => {
    const title = await browser.getTitle();
    expect(title.length).toBeGreaterThan(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP 2 – Button checks  ✓ PASS
  // ─────────────────────────────────────────────────────────────────────────

  it("[PASS-04] App view should contain exactly one sap.m.Button", async () => {
    const btns = await browser.allControls({
      selector: {
        controlType: "sap.m.Button",
        viewName:    "testingproject.view.App",
      },
    });
    expect(btns.length).toEqual(1);
  });

  it("[PASS-05] button label should equal 'Alle Bestellungen anzeigen'", async () => {
    const btns = await browser.allControls({
      selector: {
        controlType: "sap.m.Button",
        viewName:    "testingproject.view.App",
      },
    });
    const text = await btns[0].getText();
    expect(text).toEqual("Alle Bestellungen anzeigen");
  });

  it("[PASS-06] button should be enabled", async () => {
    const btns = await browser.allControls({
      selector: {
        controlType: "sap.m.Button",
        viewName:    "testingproject.view.App",
      },
    });
    expect(await btns[0].getEnabled()).toBe(true);
  });

  it("[PASS-07] button should be visible", async () => {
    const btns = await browser.allControls({
      selector: {
        controlType: "sap.m.Button",
        viewName:    "testingproject.view.App",
      },
    });
    expect(await btns[0].getVisible()).toBe(true);
  });

  it("[PASS-08] button label should not be empty", async () => {
    const btns = await browser.allControls({
      selector: {
        controlType: "sap.m.Button",
        viewName:    "testingproject.view.App",
      },
    });
    const text = await btns[0].getText();
    expect(text.length).toBeGreaterThan(0);
  });

  it("[PASS-09] pressing the button should not throw an error", async () => {
    const btns = await browser.allControls({
      selector: {
        controlType: "sap.m.Button",
        viewName:    "testingproject.view.App",
      },
    });
    let threw = false;
    try { await btns[0].press(); } catch (e) { threw = true; }
    expect(threw).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP 3 – App shell  ✓ PASS
  // ─────────────────────────────────────────────────────────────────────────

  it("[PASS-10] sap.m.App control should be rendered in the App view", async () => {
    const apps = await browser.allControls({
      selector: {
        controlType: "sap.m.App",
        viewName:    "testingproject.view.App",
      },
    });
    expect(apps.length).toBeGreaterThanOrEqual(1);
  });

  it("[PASS-11] sap.m.Page control should be rendered in the App view", async () => {
    const pages = await browser.allControls({
      selector: {
        controlType: "sap.m.Page",
        viewName:    "testingproject.view.App",
      },
    });
    expect(pages.length).toBeGreaterThanOrEqual(1);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP 4 – Intentional FAILURES (demonstrates failure reporting in SonarQube)
  // ─────────────────────────────────────────────────────────────────────────

  it("[FAIL-01] button label should be in English (intentional failure)", async () => {
    const btns = await browser.allControls({
      selector: {
        controlType: "sap.m.Button",
        viewName:    "testingproject.view.App",
      },
    });
    const text = await btns[0].getText();
    // Actual is German – this assertion is intentionally wrong
    expect(text).toEqual("Show All Orders");
  });

  it("[FAIL-02] page title should match a wrong value (intentional failure)", async () => {
    const title = await browser.getTitle();
    expect(title).toEqual("Wrong Title That Does Not Match");
  });

  it("[FAIL-03] there should be two buttons in the App view (intentional failure)", async () => {
    const btns = await browser.allControls({
      selector: {
        controlType: "sap.m.Button",
        viewName:    "testingproject.view.App",
      },
    });
    // Only 1 button exists – intentionally expects 2
    expect(btns.length).toEqual(2);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Teardown
  // ─────────────────────────────────────────────────────────────────────────
  after(async () => {
    try {
      await browser.saveScreenshot(
        "./webapp/test/__screenshots__/home-final.png"
      );
    } catch (e) {
      // Non-fatal – screenshot failure must never break the suite
      console.warn("[after] Screenshot skipped:", e.message);
    }
  });
});