---
name: commit-message
description: Generate a git commit message for staged changes. Trigger whenever the user asks for a commit message, wants to commit, or asks "what should I write for the commit". Runs git diff --staged, reads the diff, and outputs a ready-to-use message. Supports splitting changes into multiple atomic commits when the diff contains logically distinct changes.
---

# Commit Message Skill

## Steps

1. Run `git diff --staged` to see exactly what changed
2. If nothing is staged, run `git diff` as a fallback and note it
3. Analyze the diff to determine if it contains **logically distinct changes** (see "When to Split" below)
4. If the diff is atomic (one logical change), write a single commit message following the format below
5. If the diff should be split, propose a split plan and execute each commit sequentially (see "Splitting into Multiple Commits")
6. Output the message in a fenced code block so the user can copy it directly
7. Ask the user: "Commit with this message?" — use AskUserQuestion with Yes/No options
8. If approved, run `git commit -m "<subject>" -m "<body>"` (omit `-m "<body>"` when there is no body)

## When to Split

A diff should be split into multiple atomic commits when it contains **logically distinct changes** that could be understood, reviewed, or reverted independently. Split when the diff includes:

- **Bug fix + feature**: A bug fix bundled with unrelated feature work
- **Refactor + behavior change**: Code restructuring mixed with functional changes
- **Multiple unrelated concerns**: Changes to auth, styling, and API all in one diff
- **Dependencies + implementation**: Package updates or config changes that are prerequisites for code changes
- **File moves + edits**: Renaming/moving files alongside substantive content changes

**Do NOT split when:**
- All changes serve a single purpose (e.g., adding one feature across multiple files)
- Changes are tightly coupled (e.g., updating a function signature and all its callers)
- The diff is small and cohesive (under ~100 lines touching related files)

## Splitting into Multiple Commits

When splitting is warranted:

1. **Analyze the diff** and group changes by logical concern
2. **Propose a split plan** to the user:
   ```
   This diff contains 3 distinct changes:
   1. Fix login redirect bug (auth.ts, login.tsx)
   2. Add dark mode toggle (settings.tsx, theme.ts)
   3. Update dependencies (package.json, package-lock.json)
   
   I'll create 3 separate commits. Proceed?
   ```
3. **Unstage everything** first: `git reset HEAD`
4. **For each commit in the plan:**
   a. Stage only the relevant files: `git add <file1> <file2> ...`
   b. Generate a commit message following the format
   c. Show the message to the user for approval
   d. If approved, commit: `git commit -m "<subject>" -m "<body>"`
   e. If rejected, ask for adjustments or skip that commit
5. **Verify** with `git status` that all changes are committed

### Ordering Commits

When creating multiple commits, follow this order:
1. **Dependencies/config first** (package.json, config files)
2. **Infrastructure/refactors** (code structure changes)
3. **Features/fixes** (behavioral changes)
4. **Tests last** (if test changes are separate from implementation)

This order ensures each commit builds on a valid state.

### Interactive Splitting

If the user wants manual control over which changes go together:
1. Show the full diff with file names clearly labeled
2. Ask: "How would you like to group these changes?"
3. Let the user specify file groupings
4. Create commits based on their groupings

## Format

```
<subject line>

<body>
```

Follow the **50/72 rule**:

**Subject line** — 50 characters max, required, always:
- Imperative mood: "Add", "Fix", "Remove", "Update", not "Added" / "Fixes"
- No trailing period
- No conventional-commits prefix (no `feat:`, `fix:`, etc.) unless the project already uses them

**Body** — 72 character wrap, always include; one or two sentences max:
- Separated from the subject by one blank line
- For complex or large diffs: explain the motivation or constraint (the *why*), not what the code does
- For simple or mechanical changes (rename, move, format): briefly state what changed and why in plain terms
- No bullet points or numbered lists

## Examples

**Good — simple rename:**
```
Reorganize routes into (public) and (authed) groups

Separates public and authenticated routes into named groups for clarity.
```

**Good — non-obvious motivation:**
```
Lazy-load finance route bundle

Route was included in the initial chunk, adding 40 kB to first load.
```

**Bad — subject only for a complex diff (missing context):**
```
Refactor route structure
```

**Bad — bullet list in body:**
```
Refactor route structure

- Moved files from (index) to (public) and (authed)
- Deleted old layout files
- Updated routeTree.gen.ts
```

**Bad — describes what, not why:**
```
Update auth route

Changed _auth.tsx to add redirect logic.
```

**Good — split scenario (original diff had bug fix + feature):**
```
Commit 1 of 3:

Fix session expiry not redirecting to login

Session check was comparing timestamps in different timezones,
causing valid sessions to appear expired.

---

Commit 2 of 3:

Add remember-me checkbox to login form

Lets users opt into longer session duration (30 days vs 1 day).

---

Commit 3 of 3:

Update session cookie max age configuration

Aligns cookie expiry with the new remember-me feature options.
```

## What to avoid

- Bullet points or numbered lists in the message body
- Restating what the diff already shows (when explaining why)
- Phrases like "This commit…", "This PR…", "Changes include…"
- More than one blank line between subject and body
- Skipping the body entirely for non-trivial changes
