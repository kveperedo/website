/**
 * Runner for `pnpm run test:e2e:route-changed`.
 *
 * Runs only the Playwright projects whose feature changed. CI passes the PR base
 * via E2E_BASE_SHA; locally we diff against the default branch's remote-tracking
 * ref. `--base=<ref>` overrides the base for ad-hoc runs.
 *
 * Deliberately not Playwright's `--only-changed`: these UI-driven specs never
 * import the routes they exercise, so a route change would select zero tests.
 */
import { execFileSync, spawnSync } from "node:child_process";

import playwrightConfig from "./playwright.config";

const BASE_FLAG = "--base=";
const SETUP_PROJECTS = new Set(["auth.setup"]);
const args = process.argv.slice(2);
const passthrough = args.filter((arg) => !arg.startsWith(BASE_FLAG));

const allProjects = (playwrightConfig.projects ?? [])
  .map((project) => project.name)
  .filter((name): name is string => !!name && !SETUP_PROJECTS.has(name));

const FINANCE_READ = [
  "finance.empty-state",
  "finance.read",
  "finance.read-scenarios",
  "finance.trends",
  "finance.scheduled-projection",
];
const SCHEDULED = [
  "finance.scheduled-create",
  "finance.scheduled-projection",
  "finance.scheduled-archive",
];
const ALL_FINANCE = [
  "finance.empty-state",
  "finance.seed",
  "finance.read",
  "finance.read-scenarios",
  "finance.mutations",
  "finance.trends",
  ...SCHEDULED,
];

/** Ordered path prefix -> projects; first match wins. */
const PROJECTS_BY_PATH: Array<[string, Array<string>]> = [
  // The public project has no auth.setup dependency, so login needs an authed
  // project too; otherwise a broken successful-login path would go untested.
  ["src/routes/(public)/login.tsx", ["public", "finance.empty-state"]],
  ["src/routes/(public)/", ["public"]],
  ["src/routes/(authed)/_auth/applications/", ["applications"]],
  ["src/app/applications/", ["applications"]],
  ["src/routes/(authed)/_auth/finances/scheduled/", SCHEDULED],
  ["src/app/finance/scheduled/", SCHEDULED],
  ["src/routes/(authed)/_auth/finances/transactions/", ["finance.mutations"]],
  ["src/app/finance/transactions/", ["finance.mutations"]],
  ["src/app/ai/", ["finance.mutations"]],
  ["src/app/finance/analytics/", ["finance.trends"]],
  ["src/app/finance/preferences/", FINANCE_READ],
  ["src/routes/(authed)/_auth/finances/(index)/", FINANCE_READ],
  ["src/routes/(authed)/_auth/finances/", ALL_FINANCE],
  ["src/app/finance/", ALL_FINANCE],
];

/** Shared files can affect any test, so they always run the full suite. */
const FULL_SUITE_PATHS = [
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "vite.config.",
  "tsconfig",
  "cloudflare.config.ts",
  "prisma.config.ts",
  "prisma/",
  "components.json",
  ".cta.json",
  "src/styles.css",
  "src/worker.ts",
  "src/cloudflare/",
  "src/routes/__root.tsx",
  "src/routes/(authed)/_auth.tsx",
  "src/routes/api/",
  "src/components/",
  "src/app/infra/",
  "src/app/auth/",
  "src/app/e2e/",
  "src/lib/",
  "e2e/",
  ".github/",
];

function gitPaths(args: Array<string>): Array<string> {
  const output = execFileSync("git", args, { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  return output.split("\0").filter(Boolean);
}

function safeGit(args: Array<string>): string | null {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).trim() || null;
  } catch {
    return null;
  }
}

function defaultBase(): string {
  // Prefer origin's default branch: local `main` is often stale after PRs were
  // merged via GitHub, which would misreport merged files as changed.
  const remoteHead = safeGit(["symbolic-ref", "--quiet", "--short", "refs/remotes/origin/HEAD"]);
  if (remoteHead && safeGit(["rev-parse", "--verify", "--quiet", remoteHead])) {
    return remoteHead;
  }
  if (safeGit(["rev-parse", "--verify", "--quiet", "origin/main"])) {
    return "origin/main";
  }
  return "main";
}

function gitFiles(diffArgs: Array<string>): Array<string> {
  return gitPaths(["diff", "--no-renames", "--name-only", "-z", ...diffArgs]);
}

function changedFiles(): Array<string> {
  const baseFlag = args.find((arg) => arg.startsWith(BASE_FLAG));
  const base =
    (baseFlag ? baseFlag.slice(BASE_FLAG.length) : "") || process.env.E2E_BASE_SHA || defaultBase();

  // Three-dot diff = files introduced by the PR relative to its base.
  const files = new Set(gitFiles([`${base}...HEAD`]));
  // Include uncommitted local work — staged, unstaged, and untracked — too.
  for (const file of [
    ...gitFiles([]),
    ...gitFiles(["--cached"]),
    ...gitPaths(["ls-files", "--others", "--exclude-standard", "-z"]),
  ]) {
    files.add(file);
  }

  return [...files];
}

function validateProjectMap(): void {
  const mapped = new Set(PROJECTS_BY_PATH.flatMap(([, projects]) => projects));
  const unknown = [...mapped].filter((name) => !allProjects.includes(name));
  if (unknown.length > 0) {
    throw new Error(`[e2e] Unknown Playwright project(s) in route map: ${unknown.join(", ")}`);
  }

  const unmapped = allProjects.filter((name) => !mapped.has(name));
  if (unmapped.length > 0) {
    console.warn(
      `[e2e] Playwright project(s) missing from route map (${unmapped.join(", ")}); running the full suite.`,
    );
    run([]);
  }
}

function run(extraArgs: Array<string>): never {
  const result = spawnSync(
    "pnpm",
    [
      "exec",
      "playwright",
      "test",
      "--config",
      "e2e/playwright.config.ts",
      ...passthrough,
      ...extraArgs,
    ],
    { stdio: "inherit" },
  );
  process.exit(result.status ?? 1);
}

validateProjectMap();

let files: Array<string>;
try {
  files = changedFiles();
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error);
  console.warn(`[e2e] Could not determine changed files (${detail}); running the full suite.`);
  run([]);
}
console.log(`[e2e:route-changed] ${files.length} changed file(s).`);

if (files.length === 0 && process.env.E2E_BASE_SHA) {
  console.warn("[e2e] Empty CI diff; running the full suite.");
  run([]);
}

if (files.length === 0) {
  console.log("[e2e] No changed files; skipping E2E.");
  process.exit(0);
}

const shared = files.find((file) => FULL_SUITE_PATHS.some((prefix) => file.startsWith(prefix)));
if (shared) {
  console.log(`[e2e] Shared file changed (${shared}); running the full suite.`);
  run([]);
}

const projects = new Set<string>();
const unmappedFiles: Array<string> = [];
for (const file of files) {
  const match = PROJECTS_BY_PATH.find(([prefix]) => file.startsWith(prefix));
  if (match) {
    for (const project of match[1]) {
      projects.add(project);
    }
  } else {
    unmappedFiles.push(file);
  }
}

if (projects.size === 0) {
  console.warn(
    `[e2e] No changed file maps to an E2E project (${unmappedFiles.join(", ")}); running the full suite.`,
  );
  run([]);
}

const selected = [...projects];
console.log(`[e2e] Selected projects: ${selected.join(", ")}`);
run(selected.flatMap((project) => ["--project", project]));
