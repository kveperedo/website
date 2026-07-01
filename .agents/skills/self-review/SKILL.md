---
name: self-review
description: Reviews the current repository's uncommitted or unpushed changes and outputs a structured, copy-paste-ready markdown code review to the CLI. Use this skill whenever the user asks to "review my changes", "self-review", "review this diff", "review the current branch", "what do you think of my changes", or any request to review local git changes — even if they don't say "self-review" explicitly. Also trigger when the user wants a code review without providing a remote URL.
---

## Step 1 — Understand what's being reviewed

First, orient yourself. Run these to understand the repo state:

```bash
git status
git log --oneline -10
git branch --show-current
```

Then determine the right diff scope based on what the user asked:
- **Staged + unstaged changes** (default, no base specified): `git diff HEAD`
- **Staged only**: `git diff --cached`
- **Branch vs main**: `git diff main..HEAD` or `git diff origin/main..HEAD`
- **Specific commits**: `git diff <from>..<to>`

If the user mentioned a base branch, use that. Otherwise default to `git diff HEAD` to catch everything not yet committed.

---

## Step 2 — Get the diff

```bash
git diff HEAD --color=never
```

(Swap the ref as needed from Step 1.)

Read the full diff. Note which files changed, the nature of each change (new feature, refactor, bug fix, config change, etc.), and the overall scope. If the diff is large, skim for the most impactful changes first.

---

## Step 3 — Get file context

The diff alone can be misleading — read the full files for anything non-trivial. For each changed file that has meaningful logic:

- Read it directly from the working tree using the Read tool
- Pay attention to the surrounding code: naming patterns, existing error handling, how similar cases are handled elsewhere

This context is what separates a generic review from a useful one. Don't rely solely on the diff.

---

## Step 4 — Delegate to specialized subagents

Launch three subagents **in parallel** to get focused reviews. Pass each agent the full diff and any relevant file context.

### 4a. Clean Code Reviewer

Use the `clean-code-reviewer` subagent for code quality:

```
Task: Review these code changes for cleanliness, readability, and maintainability.

<diff and file context here>

Focus on: logic errors, bugs, performance issues, conventions, test coverage, missing cases, naming, code structure. Flag only issues that are genuinely inconsistent with the codebase patterns.
```

### 4b. Design System Auditor

Use the `design-system-auditor` subagent for UI/UX consistency:

```
Task: Review these code changes for design system compliance.

<diff and file context here>

Focus on: component usage consistency, styling patterns, dark theme adherence, typography, spacing, animation conventions. Check against the project's Tailwind v4 theme tokens and shadcn component patterns.
```

### 4c. Security Vulnerability Scanner

Use the `security-vulnerability-scanner` subagent for security:

```
Task: Review these code changes for security vulnerabilities.

<diff and file context here>

Focus on: unvalidated input, injection risks, exposed secrets, missing auth checks, unsafe use of user-controlled data, session handling, database query safety.
```

---

## Step 5 — Consolidate and output the review

Merge findings from all three subagents into a single structured review. Deduplicate any overlapping findings — keep the most detailed version. Use this template:

```
## Code Review

**Verdict:** <one of: ✅ Approved | 💬 Approved with suggestions | 🔄 Changes requested>

<1–2 sentence summary of what the changes do and your overall take>

━━━━━━━━━━━━━━━━━━━━━━

### `path/to/changed/file.ts`

1. **[Short issue title]** — <Bug | Suggestion | Nit | Security | Design>

   `relevant code snippet`

   Explanation of the problem and a concrete suggestion for how to fix or improve it.

2. **[Short issue title]** — <Bug | Suggestion | Nit | Security | Design>

   `relevant code snippet`

   Explanation of the problem and a concrete suggestion for how to fix or improve it.

━━━━━━━━━━━━━━━━━━━━━━

### `path/to/another/file.ts`

...

━━━━━━━━━━━━━━━━━━━━━━

### General

Any observations that span multiple files, or a positive note if the overall quality is high.
```

**Tips:**

- Group findings by file — one `###` section per file with findings
- Number each finding sequentially within each file section (1., 2., 3., etc.)
- Use `Bug` for logic errors, `Suggestion` for improvements, `Nit` for minor style issues, `Security` for vulnerabilities, `Design` for UI/UX deviations
- If a file has no issues, skip it — only include files with something to say
- Keep each finding concise: what's wrong and what to do about it, in 2–4 sentences
- If there are no issues at all, say so clearly
- End with `━━━━━━━━━━━━━━━━━━━━━━` after the last section so the output looks clean
- Use `━━━━━━━━━━━━━━━━━━━━━━` between file sections for consistent visual separation
