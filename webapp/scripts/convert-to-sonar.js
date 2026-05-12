#!/usr/bin/env node
/**
 * convert-to-sonar.js
 *
 * Reads  reports/TESTS-wdi5.xml  (JUnit XML from @wdio/junit-reporter)
 * Writes reports/test-execution.xml  (SonarQube Generic Test Execution format)
 *
 * SonarQube Generic Test Execution schema:
 *   <testExecutions version="1">
 *     <file path="relative/path/to/test/file.js">
 *       <testCase name="test name" duration="42"/>
 *       <testCase name="failing test" duration="10">
 *         <failure message="Expected X to equal Y"/>
 *       </testCase>
 *       <testCase name="skipped test" duration="0">
 *         <skipped/>
 *       </testCase>
 *     </file>
 *   </testExecutions>
 *
 * Run: node scripts/convert-to-sonar.js
 */

"use strict";

const fs   = require("fs");
const path = require("path");

const INPUT  = path.resolve(__dirname, "../reports/TESTS-wdi5.xml");
const OUTPUT = path.resolve(__dirname, "../reports/test-execution.xml");

// ── Make sure reports/ exists ────────────────────────────────────────────────
const reportsDir = path.dirname(OUTPUT);
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// ── If the JUnit file doesn't exist yet, write an empty-but-valid XML ────────
if (!fs.existsSync(INPUT)) {
  console.warn(`[convert-to-sonar] Input not found: ${INPUT}`);
  console.warn("[convert-to-sonar] Writing empty test-execution.xml so SonarQube doesn't fail.");
  fs.writeFileSync(OUTPUT,
    '<testExecutions version="1">\n</testExecutions>\n', "utf8");
  process.exit(0);
}

// ── Minimal XML parser (no external deps) ───────────────────────────────────
const xml = fs.readFileSync(INPUT, "utf8");

function attr(tag, name) {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : "";
}

function esc(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Extract <testsuite ...> blocks
const suitePattern = /<testsuite([^>]*)>([\s\S]*?)<\/testsuite>/g;
// Extract <testcase ...> and optional <failure .../> or <skipped/> inside
const casePattern  = /<testcase([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g;

const lines = ['<testExecutions version="1">'];

let suiteMatch;
while ((suiteMatch = suitePattern.exec(xml)) !== null) {
  const suiteAttrs = suiteMatch[1];
  const suiteBody  = suiteMatch[2];

  // Derive file path from the "file" attribute set by classNameFormat.
  // @wdio/junit-reporter writes the spec file path in <testsuite file="...">
  let filePath = attr(suiteAttrs, "file") || attr(suiteAttrs, "name");

  // Normalise: make relative to project root, use forward slashes
  filePath = filePath
    .replace(/^.*?webapp\//, "webapp/")   // trim any absolute prefix
    .replace(/\\/g, "/");

  if (!filePath) {
    filePath = "webapp/test/wdi5/Home.test.js";   // safe fallback
  }

  const casesInSuite = [];

  let caseMatch;
  while ((caseMatch = casePattern.exec(suiteBody)) !== null) {
    const caseAttrs = caseMatch[1];
    const caseBody  = caseMatch[2] || "";

    const name     = esc(attr(caseAttrs, "name") || "unnamed");
    const timeVal  = attr(caseAttrs, "time") || "0";
    // JUnit "time" is in seconds; SonarQube "duration" is in milliseconds
    const duration = Math.round(parseFloat(timeVal) * 1000) || 1;

    const isSkipped = /<skipped/i.test(caseBody);
    const failMatch = caseBody.match(/<failure[^>]*message="([^"]*)"/i)
                   || caseBody.match(/<error[^>]*message="([^"]*)"/i);

    if (isSkipped) {
      casesInSuite.push(
        `    <testCase name="${name}" duration="${duration}">`,
        `      <skipped/>`,
        `    </testCase>`
      );
    } else if (failMatch) {
      const msg = esc(failMatch[1]);
      casesInSuite.push(
        `    <testCase name="${name}" duration="${duration}">`,
        `      <failure message="${msg}"/>`,
        `    </testCase>`
      );
    } else {
      casesInSuite.push(
        `    <testCase name="${name}" duration="${duration}"/>`
      );
    }
  }

  if (casesInSuite.length > 0) {
    lines.push(`  <file path="${filePath}">`);
    lines.push(...casesInSuite);
    lines.push(`  </file>`);
  }
}

lines.push("</testExecutions>");

fs.writeFileSync(OUTPUT, lines.join("\n") + "\n", "utf8");
console.log(`[convert-to-sonar] Written ${OUTPUT}`);

// Print a preview so we can see it in the Jenkins log
console.log("--- test-execution.xml preview ---");
console.log(lines.join("\n"));