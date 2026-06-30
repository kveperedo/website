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
7. **Before outputting, validate:** subject ≤ 50 chars, every body line ≤ 72 chars. If either fails, rewrite until compliant
8. Ask the user: "Commit with this message?" — use AskUserQuestion with Yes/No options
9. If approved, run `git commit -m "<subject>" -m "<body>"` (omit `-m "<body>"` when there is no body)

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

- Change A
- Change B
- Change C
```

### Subject line (strict)

- **Max 50 characters.** Count carefully. If it exceeds 50, shorten it.
- Imperative mood: "Add", "Fix", "Remove", "Update" — never "Added", "Fixes", "Updating"
- No trailing period
- No conventional-commits prefix (`feat:`, `fix:`, etc.) unless the project already uses them
- If you cannot describe the change in under 50 characters, the subject should be a higher-level summary and the details go in the body

### Body (strict)

- **Max 72 characters per line.** Wrap every line at 72 chars. No line may exceed 72 characters.
- Separated from the subject by exactly one blank line
- Use a dash (`-`) followed by a space to list each distinct change
- Keep each dash item short and concrete — describe *what* changed, not *why* (the why belongs in the subject or a separate line above the list)
- No more than 6 dash items. If more changes exist, group related ones or summarize
- No nested lists, no numbering, no sub-bullets

## Examples

**Good — simple rename:**
```
Reorganize routes into (public) and (authed) groups

- Renamed route groups for clarity
- Separated public and authenticated route trees
```

**Good — non-obvious motivation:**
```
Lazy-load finance route bundle

- Route was included in the initial 40 kB chunk
- Moved to dynamic import to reduce first load
```

**Bad — subject only for a complex diff (missing context):**
```
Refactor route structure
```

**Bad — bullet list in body (not concise):**
```
Refactor route structure

- Moved files from (index) to (public) and (authed)
- Deleted old layout files
- Updated routeTree.gen.ts
- Added new layout wrapper
```

**Good — concise dash items:**
```
Refactor route structure

- Move routes into (public) and (authed) groups
- Remove unused layout wrappers
- Regenerate route tree
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

- Session check compared timestamps in different timezones

---

Commit 2 of 3:

Add remember-me checkbox to login form

- Lets users opt into 30-day session duration

---

Commit 3 of 3:

Update session cookie max age configuration

- Aligns cookie expiry with remember-me feature
```

## What to avoid

- Lines in the body exceeding 72 characters
- Subject lines exceeding 50 characters
- Restating what the diff already shows (when explaining why)
- Phrases like "This commit…", "This PR…", "Changes include…"
- More than one blank line between subject and body
- Skipping the body entirely for non-trivial changes
- Vague dash items like "Updated code" or "Fixed stuff"
