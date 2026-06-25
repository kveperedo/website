---
name: commit-message
description: Generate a git commit message for staged changes. Trigger whenever the user asks for a commit message, wants to commit, or asks "what should I write for the commit". Runs git diff --staged, reads the diff, and outputs a ready-to-use message.
---

# Commit Message Skill

## Steps

1. Run `git diff --staged` to see exactly what changed
2. If nothing is staged, run `git diff` as a fallback and note it
3. Read the diff and write a commit message following the format below
4. Output the message in a fenced code block so the user can copy it directly
5. Ask the user: "Commit with this message?" — use AskUserQuestion with Yes/No options
6. If approved, run `git commit -m "<subject>" -m "<body>"` (omit `-m "<body>"` when there is no body)

## Format

```
<subject line>

<body>
```

**Subject line** — required, always:
- Imperative mood: "Add", "Fix", "Remove", "Update", not "Added" / "Fixes"
- 72 characters max
- No trailing period
- No conventional-commits prefix (no `feat:`, `fix:`, etc.) unless the project already uses them

**Body** — always include; one or two sentences max:
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

## What to avoid

- Bullet points or numbered lists in the message body
- Restating what the diff already shows (when explaining why)
- Phrases like "This commit…", "This PR…", "Changes include…"
- More than one blank line between subject and body
- Skipping the body entirely for non-trivial changes
