const { wdi5 } = require("wdio-ui5-service");

describe("Testing home of test project", () => {
  before(async () => {
    await wdi5.goTo("#");
  });

  // ─── Page Title ───────────────────────────────────────────────────────────
  it("should have title containing 'This is a test project for testing'", async () => {
    const title = await browser.getTitle();
    expect(title).toEqual("This is a test project for testing");
  });

  // ─── Button existence & count ─────────────────────────────────────────────
  it("should have one button", async () => {
    const selector = {
      selector: {
        controlType: "sap.m.Button",
        viewName: "testingproject.view.App",
      },
    };
    const btn = await browser.allControls(selector);
    expect(btn.length).toEqual(1);
  });

  it("should get text of button", async () => {
    const selector = {
      selector: {
        controlType: "sap.m.Button",
        viewName: "testingproject.view.App",
      },
    };
    const btn = await browser.allControls(selector);
    const title = await btn[0].getText();
    expect(title).toEqual("Alle Bestellungen anzeigen");
  });

  // ─── Button state ─────────────────────────────────────────────────────────
  it("should have an enabled button", async () => {
    const selector = {
      selector: {
        controlType: "sap.m.Button",
        viewName: "testingproject.view.App",
      },
    };
    const btn = await browser.allControls(selector);
    const isEnabled = await btn[0].getEnabled();
    expect(isEnabled).toBe(true);
  });

  it("should have a visible button", async () => {
    const selector = {
      selector: {
        controlType: "sap.m.Button",
        viewName: "testingproject.view.App",
      },
    };
    const btn = await browser.allControls(selector);
    const isVisible = await btn[0].getVisible();
    expect(isVisible).toBe(true);
  });

  // ─── Page URL ─────────────────────────────────────────────────────────────
  it("should load the correct base URL", async () => {
    const url = await browser.getUrl();
    expect(url).toContain("localhost");
  });

  // ─── App Shell / Page structure ───────────────────────────────────────────
  it("should render the App view shell", async () => {
    const selector = {
      selector: {
        viewName: "testingproject.view.App",
        controlType: "sap.m.App",
      },
    };
    const app = await browser.allControls(selector);
    expect(app.length).toBeGreaterThanOrEqual(1);
  });

  // ─── Button press (navigation / side-effect) ──────────────────────────────
  it("should be pressable without throwing", async () => {
    const selector = {
      selector: {
        controlType: "sap.m.Button",
        viewName: "testingproject.view.App",
      },
    };
    const btn = await browser.allControls(selector);
    // Press the button and verify no exception is thrown
    await expect(btn[0].press()).resolves.not.toThrow();
  });

  // ─── Screenshot on completion ─────────────────────────────────────────────
  after(async () => {
    await browser.saveScreenshot("./webapp/test/__screenshots__/home-final.png");
  });
});