const path = require("path");
const fs   = require("fs");

const isCI        = process.env.CI === "true";
const isHeadless  = isCI || process.argv.includes("--headless");
const isDebug     = process.argv.includes("--debug");
const seleniumHub = process.env.SELENIUM_HUB || "http://selenium:4444/wd/hub";

// ── Ensure output directories exist before reporters try to write ────────────
["./reports", "./webapp/test/__screenshots__"].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── Custom reporter: writes SonarQube Generic Test Execution XML ─────────────
// SonarQube's sonar.testExecutionReportPaths requires the <testExecutions version="1">
// format, NOT JUnit XML. This reporter converts wdio results into that format.
class SonarGenericReporter {
  constructor(options, _caps, _specs) {
    this.outputFile = options.outputFile || "./reports/test-execution.xml";
    this.suites     = [];
  }

  onSuiteStart(suite) {
    this.currentSuite = { name: suite.title, file: suite.file, cases: [] };
    this.suites.push(this.currentSuite);
  }

  onTestPass(test) {
    this.currentSuite.cases.push({ name: test.title, duration: test.duration || 1, status: "pass" });
  }

  onTestFail(test) {
    this.currentSuite.cases.push({
      name: test.title, duration: test.duration || 1, status: "fail",
      message: (test.error && test.error.message) || "Test failed"
    });
  }

  onTestSkip(test) {
    this.currentSuite.cases.push({ name: test.title, duration: 0, status: "skip" });
  }

  onRunnerEnd() {
    const lines = ['<testExecutions version="1">'];
    const projectRoot = process.cwd();

    for (const suite of this.suites) {
      if (!suite.cases.length) continue;
      // path must be relative to the project root
      const relFile = path.relative(projectRoot, suite.file || suite.name);
      lines.push(`  <file path="${relFile}">`);
      for (const tc of suite.cases) {
        const safeName = tc.name.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
        if (tc.status === "pass") {
          lines.push(`    <testCase name="${safeName}" duration="${tc.duration}"/>`);
        } else if (tc.status === "fail") {
          const msg = tc.message.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
          lines.push(`    <testCase name="${safeName}" duration="${tc.duration}">`);
          lines.push(`      <failure message="${msg}"/>`);
          lines.push(`    </testCase>`);
        } else {
          lines.push(`    <testCase name="${safeName}" duration="0">`);
          lines.push(`      <skipped/>`);
          lines.push(`    </testCase>`);
        }
      }
      lines.push("  </file>");
    }
    lines.push("</testExecutions>");

    fs.writeFileSync(this.outputFile, lines.join("\n"), "utf8");
    console.log(`[SonarGenericReporter] Written: ${this.outputFile}`);
  }
}

SonarGenericReporter.reporterName = "sonar-generic";

// ─────────────────────────────────────────────────────────────────────────────

exports.config = {
  // ── wdi5 ──────────────────────────────────────────────────────────────────
  wdi5: {
    screenshotPath:       "./webapp/test/__screenshots__",
    screenshotsDisabled:  false,
    logLevel:             "error",
    url:                  "index.html",
    skipInjectUI5OnStart: false,
    waitForUI5Timeout:    15000,
  },

  // ── Test specs ─────────────────────────────────────────────────────────────
  specs:   ["./webapp/test/wdi5/**/*.test.js"],
  exclude: [],

  // ── Capabilities ───────────────────────────────────────────────────────────
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

  // ── WebdriverIO settings ────────────────────────────────────────────────────
  logLevel:               "error",
  bail:                   0,

  // In CI the app itself is served separately; BASE_URL env var controls where
  // e.g.  http://localhost:8080  (or your deployed app URL)
  baseUrl:                process.env.BASE_URL || "http://localhost:8080",

  waitforTimeout:         10000,
  connectionRetryTimeout: isDebug ? 1200000 : 120000,
  connectionRetryCount:   3,

  // CI  → connect to Selenium sidecar; no local chromedriver needed
  // Local → wdio-chromedriver-service manages ChromeDriver automatically
  services: isCI ? ["ui5"] : ["chromedriver", "ui5"],

  ...(isCI && {
    hostname: new URL(seleniumHub).hostname,
    port:     parseInt(new URL(seleniumHub).port || "4444", 10),
    path:     "/wd/hub",
  }),

  // ── Framework ───────────────────────────────────────────────────────────────
  framework: "mocha",

  // ── Reporters ───────────────────────────────────────────────────────────────
  reporters: [
    // 1. Human-readable console output
    "spec",

    // 2. JUnit XML  →  reports/TESTS-wdi5.xml
    //    consumed by Jenkins testsPublishResults (pattern: **/reports/TESTS*.xml)
    ["junit", {
      outputDir: "./reports",
      outputFileFormat: () => "TESTS-wdi5.xml",
      classNameFormat:  ({ parent }) => parent,
      titleFormat:      ({ title  }) => title,
    }],

    // 3. SonarQube Generic Test Execution XML  →  reports/test-execution.xml
    //    consumed by sonar.testExecutionReportPaths=reports/test-execution.xml
    [SonarGenericReporter, {
      outputFile: "./reports/test-execution.xml",
    }],
  ],

  // ── Mocha ───────────────────────────────────────────────────────────────────
  mochaOpts: {
    ui:      "bdd",
    timeout: isDebug ? 600000 : 60000,
  },
};