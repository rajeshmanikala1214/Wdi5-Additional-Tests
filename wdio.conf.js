const isCI        = process.env.CI === 'true';
const isHeadless  = isCI || process.argv.includes('--headless');
const isDebug     = process.argv.includes('--debug');
const seleniumHub = process.env.SELENIUM_HUB || 'http://selenium:4444/wd/hub';

exports.config = {
    // ── wdi5 ────────────────────────────────────────────────────────────────
    wdi5: {
        screenshotPath:       'webapp/test/__screenshots__',
        screenshotsDisabled:  false,
        logLevel:             'error',
        url:                  'index.html',
        skipInjectUI5OnStart: false,
        waitForUI5Timeout:    15000
    },

    // ── Test specs ──────────────────────────────────────────────────────────
    specs:   ['./webapp/test/wdi5/**/*.test.js'],
    exclude: [],

    // ── Capabilities ────────────────────────────────────────────────────────
    maxInstances: 1,
    capabilities: [{
        maxInstances: 1,
        browserName:  'chrome',
        'goog:chromeOptions': {
            args: isHeadless
                ? ['--headless', '--no-sandbox', '--disable-dev-shm-usage',
                   '--disable-gpu', '--window-size=1440,800']
                : isDebug
                    ? ['--window-size=1440,800', '--auto-open-devtools-for-tabs']
                    : ['--window-size=1440,800']
        },
        acceptInsecureCerts: true
    }],

    // ── WebdriverIO config ──────────────────────────────────────────────────
    logLevel:               'error',
    bail:                   0,
    baseUrl:                process.env.BASE_URL || 'http://localhost:8080',
    waitforTimeout:         10000,
    connectionRetryTimeout: isDebug ? 1200000 : 120000,
    connectionRetryCount:   3,

    // CI  → connect to Selenium sidecar hub; no local chromedriver needed
    // Local → wdio-chromedriver-service manages ChromeDriver automatically
    services: isCI ? ['ui5'] : ['chromedriver', 'ui5'],

    ...(isCI && {
        hostname: new URL(seleniumHub).hostname,
        port:     parseInt(new URL(seleniumHub).port || '4444', 10),
        path:     '/wd/hub'
    }),

    // ── Framework ───────────────────────────────────────────────────────────
    framework: 'mocha',

    // ── Reporters ───────────────────────────────────────────────────────────
    // spec   → human-readable console
    // junit  → reports/TESTS-wdi5.xml  (consumed by testsPublishResults + SonarQube)
    reporters: [
        'spec',
        ['junit', {
            outputDir: './reports',
            outputFileFormat: () => 'TESTS-wdi5.xml',
            classNameFormat:  ({ parent }) => parent,
            titleFormat:      ({ title  }) => title
        }]
    ],

    // ── Mocha ────────────────────────────────────────────────────────────────
    mochaOpts: {
        ui:      'bdd',
        timeout: isDebug ? 600000 : 60000
    }
};