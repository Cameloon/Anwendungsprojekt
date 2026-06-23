import { readFileSync, writeFileSync } from "fs";
import { resolve, relative } from "path";

const ROOT = resolve(import.meta.dirname, "..");
const INPUT = resolve(ROOT, ".test-results.json");
const OUTPUT = resolve(ROOT, "docs/test-uebersicht.md");

type AssertionResult = {
  ancestorTitles: string[];
  title: string;
  status: "passed" | "failed" | "todo" | "pending";
  failureMessages: string[];
};

type FileResult = {
  name: string;
  assertionResults: AssertionResult[];
};

type Report = {
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  numTodoTests: number;
  numPendingTests: number;
  startTime: number;
  testResults: FileResult[];
};

const STATUS_ICON: Record<AssertionResult["status"], string> = {
  passed: "✅",
  failed: "❌",
  todo: "🔜",
  pending: "⏸",
};

const report: Report = JSON.parse(readFileSync(INPUT, "utf-8"));

const timestamp = new Date(report.startTime).toISOString().replace("T", " ").slice(0, 16);

const lines: string[] = [
  "# Test-Übersicht",
  "",
  "<!-- Automatisch generiert von scripts/update-test-status.ts — nicht manuell bearbeiten -->",
  `<!-- Letzte Aktualisierung: ${timestamp} UTC -->`,
  "",
  "## Gesamtstatus",
  "",
  `| ✅ Bestanden | ❌ Fehlgeschlagen | 🔜 Todo | ⏸ Übersprungen |`,
  `|-------------|------------------|---------|----------------|`,
  `| ${report.numPassedTests} | ${report.numFailedTests} | ${report.numTodoTests} | ${report.numPendingTests} |`,
  "",
];

for (const file of report.testResults) {
  const relativePath = relative(ROOT, file.name);
  lines.push(`## ${relativePath}`, "");

  // Group by top-level describe block
  const suites = new Map<string, AssertionResult[]>();
  for (const assertion of file.assertionResults) {
    const suite = assertion.ancestorTitles[0] ?? "(kein describe)";
    if (!suites.has(suite)) suites.set(suite, []);
    suites.get(suite)!.push(assertion);
  }

  for (const [suite, assertions] of suites) {
    lines.push(`### ${suite}`, "");
    for (const a of assertions) {
      const icon = STATUS_ICON[a.status] ?? "❓";
      lines.push(`- ${icon} ${a.title}`);
      if (a.status === "failed" && a.failureMessages.length > 0) {
        const msg = a.failureMessages[0].split("\n")[0].trim();
        lines.push(`  - \`${msg}\``);
      }
    }
    lines.push("");
  }
}

writeFileSync(OUTPUT, lines.join("\n"), "utf-8");
console.log(`✅ docs/test-uebersicht.md aktualisiert (${timestamp} UTC)`);
