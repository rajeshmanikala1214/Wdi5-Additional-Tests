const fs = require("fs");

const isCI       = process.env.CI === "true";
const isHeadless = isCI || process.argv.includes("--headless");
const isDebug    = process.argv.includes("--debug");

const seleniumHost = process.env.SELENIUM_HOST || "selenium";
const seleniumPort = parseInt(process.env.SELENIUM_PORT || "4444", 10);
const baseUrl      = process.env.BASE_URL || "http://localhost:8080";

// Which suite to run: SUITE=qunit | wdi5 | (unset = all)
const suite = process.env.SUITE || "all";

["./reports", "./webapp/test/__screenshots__"].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// QUnit + OPA5 run through wdio-qunit-service against the HTML runner pages.
// These are generic: every standard UI5 app exposes these two entry pages.
const qunitSpecs = ["./webapp/test/**/*.qunit.js"];   // driver specs, see note below
const wdi5Specs  = ["./webapp/test/wdi5/**/*.test.js"];

const specsBySuite = {
  qunit: qunitSpecs,
  wdi5:  wdi5Specs,
  all:   [...qunitSpecs, ...wdi5Specs],
};

exports.config = {
  wdi5: {
    screenshotPath:       "./webapp/test/__screenshots__",
    screenshotsDisabled:  false,
    logLevel:             "error",
    url:                  "index.html",
    waitForUI5Timeout:    20000,
  },

  specs: specsBySuite[suite],
  exclude: [],

  maxInstances: 1,
  capabilities: [{
    maxInstances: 1,
    browserName: "chrome",
    "goog:chromeOptions": {
      args: isHeadless
        ? ["--headless", "--no-sandbox", "--disable-dev-shm-usage",
           "--disable-gpu", "--window-size=1440,800", "--ignore-certificate-errors"]
        : isDebug
          ? ["--window-size=1440,800", "--auto-open-devtools-for-tabs"]
          : ["--window-size=1440,800"],
    },
    acceptInsecureCerts: true,
  }],

  logLevel: "warn",
  bail: 0,
  baseUrl,
  waitforTimeout: 15000,
  connectionRetryTimeout: isDebug ? 1200000 : 180000,
  connectionRetryCount: 5,

  // qunit service dynamically turns the QUnit HTML pages into wdio suites;
  // ui5 service (wdio-ui5-service) provides WDI5 bindings.
  services: isCI
    ? ["qunit", "ui5"]
    : ["chromedriver", "qunit", "ui5"],

  ...(isCI && { hostname: seleniumHost, port: seleniumPort, path: "/wd/hub" }),

  framework: "mocha",

  reporters: [
    "spec",
    ["junit", {
      outputDir: "./reports",
      outputFileFormat: () => "TESTS-wdi5.xml",   // matches convert-to-sonar.js input
      classNameFormat: ({ parent }) => parent,
      titleFormat: ({ title }) => title,
    }],
  ],

  mochaOpts: { ui: "bdd", timeout: isDebug ? 600000 : 90000 },

  // After the run, convert JUnit → Sonar generic test-execution XML
  onComplete() {
    try { require("child_process").execSync("node scripts/convert-to-sonar.js", { stdio: "inherit" }); }
    catch (e) { console.warn("[wdio] sonar convert failed:", e.message); }
  },
};