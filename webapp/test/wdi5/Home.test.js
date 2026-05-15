/**
 * Home.test.js  –  wdio-ui5-service v0.9.x
 *
 * The app is served at:
 *   Local CI:   http://localhost:8080  (ui5 serve running locally)
 *   Jenkins CI: http://appserver:8080  (Docker network alias, set via BASE_URL)
 *
 * wdio.conf.js baseUrl = process.env.BASE_URL || "http://localhost:8080"
 * browser.url("index.html") resolves against baseUrl automatically.
 */

describe("Testing home of test project", () => {

  // ── One-time setup ────────────────────────────────────────────────────────
  before(async () => {
    // Ensure screenshots directory exists (container may not have it)
    const fs  = require("fs");
    const dir = "./webapp/test/__screenshots__";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  before(async () => {
    // Navigate to the app.  baseUrl is already set to http://appserver:8080
    // so a relative path resolves to the correct place in all environments.
    await browser.url("index.html");

    // Wait for UI5 to finish bootstrapping (up to 20 s)
    await browser.waitUntil(
      async () => {
        return await browser.execute(() => {
          try {
            return (
              typeof sap !== "undefined" &&
              sap.ui &&
              typeof sap.ui.getCore === "function" &&
              sap.ui.getCore().isInitialized()
            );
          } catch (_) {
            return false;
          }
        });
      },
      {
        timeout:    20000,
        interval:   500,
        timeoutMsg: "UI5 did not initialise within 20 s – is the app server reachable?",
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

  it("[PASS-03] page title should not be empty", async () => {
    const title = await browser.getTitle();
    expect(title.length).toBeGreaterThan(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP 2 – Button checks  ✓ PASS
  // ─────────────────────────────────────────────────────────────────────────

  it("[PASS-04] App view should contain exactly one sap.m.Button", async () => {
    const btns = await browser.allControls({
      selector: { controlType: "sap.m.Button", viewName: "testingproject.view.App" },
    });
    expect(btns.length).toEqual(1);
  });

  it("[PASS-05] button label should equal 'Alle Bestellungen anzeigen'", async () => {
    const btns = await browser.allControls({
      selector: { controlType: "sap.m.Button", viewName: "testingproject.view.App" },
    });
    expect(await btns[0].getText()).toEqual("Alle Bestellungen anzeigen");
  });

  it("[PASS-06] button should be enabled", async () => {
    const btns = await browser.allControls({
      selector: { controlType: "sap.m.Button", viewName: "testingproject.view.App" },
    });
    expect(await btns[0].getEnabled()).toBe(true);
  });

  it("[PASS-07] button should be visible", async () => {
    const btns = await browser.allControls({
      selector: { controlType: "sap.m.Button", viewName: "testingproject.view.App" },
    });
    expect(await btns[0].getVisible()).toBe(true);
  });

  it("[PASS-08] button label should not be empty", async () => {
    const btns = await browser.allControls({
      selector: { controlType: "sap.m.Button", viewName: "testingproject.view.App" },
    });
    expect((await btns[0].getText()).length).toBeGreaterThan(0);
  });

  it("[PASS-09] pressing the button should not throw", async () => {
    const btns = await browser.allControls({
      selector: { controlType: "sap.m.Button", viewName: "testingproject.view.App" },
    });
    let threw = false;
    try { await btns[0].press(); } catch (_) { threw = true; }
    expect(threw).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP 3 – App shell  ✓ PASS
  // ─────────────────────────────────────────────────────────────────────────

  it("[PASS-10] sap.m.App should be rendered in the App view", async () => {
    const apps = await browser.allControls({
      selector: { controlType: "sap.m.App", viewName: "testingproject.view.App" },
    });
    expect(apps.length).toBeGreaterThanOrEqual(1);
  });

  it("[PASS-11] sap.m.Page should be rendered in the App view", async () => {
    const pages = await browser.allControls({
      selector: { controlType: "sap.m.Page", viewName: "testingproject.view.App" },
    });
    expect(pages.length).toBeGreaterThanOrEqual(1);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP 4 – Intentional FAILURES (shows failure reporting in SonarQube)
  // ─────────────────────────────────────────────────────────────────────────

  it("[FAIL-01] button label should be in English (intentional failure)", async () => {
    const btns = await browser.allControls({
      selector: { controlType: "sap.m.Button", viewName: "testingproject.view.App" },
    });
    // Actual is German – intentionally wrong assertion
    expect(await btns[0].getText()).toEqual("Show All Orders");
  });

  it("[FAIL-02] page title should match wrong value (intentional failure)", async () => {
    expect(await browser.getTitle()).toEqual("Wrong Title That Does Not Match");
  });

  it("[FAIL-03] there should be two buttons in App view (intentional failure)", async () => {
    const btns = await browser.allControls({
      selector: { controlType: "sap.m.Button", viewName: "testingproject.view.App" },
    });
    expect(btns.length).toEqual(2);  // only 1 exists
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Teardown
  // ─────────────────────────────────────────────────────────────────────────
  after(async () => {
    try {
      await browser.saveScreenshot("./webapp/test/__screenshots__/home-final.png");
    } catch (e) {
      console.warn("[after] Screenshot skipped:", e.message);
    }
  });
});