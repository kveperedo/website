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

## Step 4 — Review the changes

Look for:

- **Bugs** — logic errors, incorrect conditions, off-by-one issues, missing null/undefined guards, incorrect assumptions about data shape
- **Security** — unvalidated input, injection risks, exposed secrets, missing auth checks, unsafe use of user-controlled data
- **Performance** — unnecessary re-renders, N+1 queries, inefficient loops, missing memoization where it matters
- **Conventions** — does the code follow the patterns already in this codebase? Check surrounding code before flagging style issues — don't enforce a personal preference if the codebase doesn't follow it
- **Test coverage** — are the changes tested? Are error states, edge cases, and empty states covered?
- **Missing cases** — error handling, loading states, race conditions, cleanup on unmount

Be specific — tie every finding to a file and a code reference. Don't flag nits unless they're genuinely inconsistent with the rest of the codebase. If the change is clean and correct, say so — a positive review is a useful outcome too.

---

## Step 5 — Output the review

Print the review as formatted markdown to the CLI. Use this template:

```
## Code Review

**Verdict:** <one of: ✅ Approved | 💬 Approved with suggestions | 🔄 Changes requested>

<1–2 sentence summary of what the changes do and your overall take>

━━━━━━━━━━━━━━━━━━━━━━

### `path/to/changed/file.ts`

**[Short issue title]** — <Bug | Suggestion | Nit>

\`relevant code snippet\`

Explanation of the problem and a concrete suggestion for how to fix or improve it.

━━━━━━━━━━━━━━━━━━━━━━

**[Another issue in the same file]** — <Bug | Suggestion | Nit>

\`relevant code snippet\`

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
- Use `Bug` for things that could cause incorrect behavior, `Suggestion` for improvements worth making, `Nit` for minor style/readability issues
- If a file has no issues, skip it — only include files with something to say
- Keep each finding concise: what's wrong and what to do about it, in 2–4 sentences
- If there are no issues at all, say so clearly
- End with `━━━━━━━━━━━━━━━━━━━━━━` after the last section so the output looks clean
- Use `━━━━━━━━━━━━━━━━━━━━━━` between every issue (within a file and between files) for consistent visual separation
