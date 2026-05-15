const fs = require("fs");

const isCI        = process.env.CI === "true";
const isHeadless  = isCI || process.argv.includes("--headless");
const isDebug     = process.argv.includes("--debug");
const seleniumHost = process.env.SELENIUM_HOST || "selenium";
const seleniumPort = parseInt(process.env.SELENIUM_PORT || "4444", 10);

// BASE_URL is set by the pipeline via dockerEnvVars: http://appserver:8080
// Locally it falls back to http://localhost:8080
const baseUrl = process.env.BASE_URL || "http://localhost:8080";

// Ensure output directories exist before any reporter tries to write
["./reports", "./webapp/test/__screenshots__"].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

exports.config = {
  // ── wdi5 ─────────────────────────────────────────────────────────────────
  wdi5: {
    screenshotPath:       "./webapp/test/__screenshots__",
    screenshotsDisabled:  false,
    logLevel:             "error",
    url:                  "index.html",
    skipInjectUI5OnStart: false,
    waitForUI5Timeout:    20000,   // extra time in CI
  },

  // ── Test specs ────────────────────────────────────────────────────────────
  specs:   ["./webapp/test/wdi5/**/*.test.js"],
  exclude: [],

  // ── Capabilities ──────────────────────────────────────────────────────────
  maxInstances: 1,
  capabilities: [{
    maxInstances: 1,
    browserName:  "chrome",
    "goog:chromeOptions": {
      args: isHeadless
        ? ["--headless", "--no-sandbox", "--disable-dev-shm-usage",
           "--disable-gpu", "--window-size=1440,800",
           "--ignore-certificate-errors"]
        : isDebug
          ? ["--window-size=1440,800", "--auto-open-devtools-for-tabs"]
          : ["--window-size=1440,800"],
    },
    acceptInsecureCerts: true,
  }],

  // ── WebdriverIO settings ───────────────────────────────────────────────────
  logLevel:               "warn",
  bail:                   0,

  // In CI: app is served at http://appserver:8080 (Docker network alias)
  // Locally: http://localhost:8080
  baseUrl,

  waitforTimeout:         15000,
  connectionRetryTimeout: isDebug ? 1200000 : 180000,
  connectionRetryCount:   5,

  // CI  → WebdriverIO talks to the Selenium hub sidecar
  // Local → wdio-chromedriver-service manages ChromeDriver automatically
  services: isCI ? ["ui5"] : ["chromedriver", "ui5"],

  ...(isCI && {
    hostname: seleniumHost,
    port:     seleniumPort,
    path:     "/wd/hub",
  }),

  // ── Framework ─────────────────────────────────────────────────────────────
  framework: "mocha",

  // ── Reporters ─────────────────────────────────────────────────────────────
  reporters: [
    "spec",
    ["junit", {
      outputDir:        "./reports",
      outputFileFormat: () => "TESTS-wdi5.xml",
      classNameFormat:  ({ parent }) => parent,
      titleFormat:      ({ title  }) => title,
    }],
  ],

  // ── Mocha ─────────────────────────────────────────────────────────────────
  mochaOpts: {
    ui:      "bdd",
    timeout: isDebug ? 600000 : 90000,   // 90s per test in CI
  },
};