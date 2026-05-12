const fs = require("fs");

const isCI       = process.env.CI === "true";
const isHeadless = isCI || process.argv.includes("--headless");
const isDebug    = process.argv.includes("--debug");

// Selenium sidecar hostname (set by npmExecuteTests sidecarName: "selenium")
const seleniumHost = process.env.SELENIUM_HOST || "selenium";
const seleniumPort = parseInt(process.env.SELENIUM_PORT || "4444", 10);

// Ensure output directories exist before any reporter tries to write
["./reports", "./webapp/test/__screenshots__"].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

exports.config = {
  // ── wdi5 ────────────────────────────────────────────────────────────────
  wdi5: {
    screenshotPath:       "./webapp/test/__screenshots__",
    screenshotsDisabled:  false,
    logLevel:             "error",
    url:                  "index.html",
    skipInjectUI5OnStart: false,
    waitForUI5Timeout:    15000,
  },

  // ── Specs ──────────────────────────────────────────────────────────────
  specs:   ["./webapp/test/wdi5/**/*.test.js"],
  exclude: [],

  // ── Capabilities ────────────────────────────────────────────────────────
  maxInstances: 1,
  capabilities: [{
    maxInstances: 1,
    browserName:  "chrome",
    "goog:chromeOptions": {
      args: isHeadless
        ? ["--headless", "--no-sandbox", "--disable-dev-shm-usage",
           "--disable-gpu", "--window-size=1440,800"]
        : isDebug
          ? ["--window-size=1440,800", "--auto-open-devtools-for-tabs"]
          : ["--window-size=1440,800"],
    },
    acceptInsecureCerts: true,
  }],

  // ── Connectivity ────────────────────────────────────────────────────────
  logLevel:               "error",
  bail:                   0,

  // The app under test. In CI the node container can reach the app at
  // http://localhost:8080 because both run in the same Docker network.
  // The Selenium *hub* address is configured below via hostname/port/path.
  baseUrl: process.env.BASE_URL || "http://localhost:8080",

  waitforTimeout:         10000,
  connectionRetryTimeout: isDebug ? 1200000 : 120000,
  connectionRetryCount:   3,

  // CI  → point WebdriverIO at the Selenium sidecar hub
  // Local → wdio-chromedriver-service manages ChromeDriver automatically
  services: isCI ? ["ui5"] : ["chromedriver", "ui5"],

  ...(isCI && {
    hostname: seleniumHost,   // "selenium" – the Docker network alias
    port:     seleniumPort,   // 4444
    path:     "/wd/hub",
  }),

  // ── Framework ────────────────────────────────────────────────────────────
  framework: "mocha",

  // ── Reporters ────────────────────────────────────────────────────────────
  // Only use officially-supported string-based reporters.
  // JUnit XML → reports/TESTS-wdi5.xml (consumed by testsPublishResults)
  // SonarQube Generic XML is produced AFTER the run by scripts/convert-to-sonar.js
  reporters: [
    "spec",
    ["junit", {
      outputDir:        "./reports",
      outputFileFormat: () => "TESTS-wdi5.xml",
      classNameFormat:  ({ parent }) => parent,
      titleFormat:      ({ title  }) => title,
    }],
  ],

  // ── Mocha ──────────────────────────────────────────────────────────────
  mochaOpts: {
    ui:      "bdd",
    timeout: isDebug ? 600000 : 60000,
  },
};