exports.config = {
    wdi5: {
        screenshotPath: "webapp/test/__screenshots__",
        screenshotsDisabled: false,
        logLevel: "error",
        url: "index.html",
        skipInjectUI5OnStart: false,
        waitForUI5Timeout: 15000
    },

    specs: ["./webapp/test/wdi5/**/*.test.js"],
    exclude: [],

    maxInstances: 10,

    capabilities: [
        {
            maxInstances: 5,
            browserName: "chrome",
            "goog:chromeOptions": {
                // Always run headless in CI; locally pass --debug for DevTools
                args:
                    process.env.CI === "true" || process.argv.indexOf("--headless") > -1
                        ? ["--headless", "--no-sandbox", "--disable-dev-shm-usage",
                           "--disable-gpu", "window-size=1440,800"]
                        : process.argv.indexOf("--debug") > -1
                        ? ["window-size=1440,800", "--auto-open-devtools-for-tabs"]
                        : ["window-size=1440,800"]
            },
            acceptInsecureCerts: true
        }
    ],

    logLevel: "error",
    bail: 0,
    baseUrl: process.env.BASE_URL || "http://localhost:8080",
    waitforTimeout: 10000,
    connectionRetryTimeout: process.argv.indexOf("--debug") > -1 ? 1200000 : 120000,
    connectionRetryCount: 3,

    services: ["chromedriver", "ui5"],
    framework: "mocha",

    // ── Reporters ────────────────────────────────────────────────────────────
    // spec   → human-readable console output
    // junit  → XML consumed by SonarQube / Jenkins / ReleaseOwl
    reporters: [
        "spec",
        [
            "junit",
            {
                outputDir: "./test-results",           // <-- SonarQube reads this
                outputFileFormat: function (options) {
                    return `wdi5-results-${options.cid}.xml`;
                },
                classNameFormat: ({ parent }) => parent,
                titleFormat: ({ title }) => title
            }
        ]
    ],

    mochaOpts: {
        ui: "bdd",
        timeout: process.argv.indexOf("--debug") > -1 ? 600000 : 60000
    }
};