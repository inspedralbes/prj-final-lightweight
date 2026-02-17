---
name: review-pr
description: Review a GitHub PR thoroughly — security, code quality, patterns, tests — and optionally post the review as a comment
disable-model-invocation: true
argument-hint: "[PR number or empty for latest]"
---

# PR Review Skill

Review GitHub PR `$ARGUMENTS` (if no number provided, find the most recent open PR in the current repo).

## Step 1: Gather PR Context

Run these commands to understand the PR:

```
gh pr list --state open
gh pr view <number> --json title,body,author,baseRefName,headRefName,additions,deletions,changedFiles,commits
gh pr diff <number>
```

If the diff is large (>1000 lines), save it to a temp file and use subagents in parallel to review different areas (e.g., backend, frontend, tests, infrastructure). Adapt the split to the project's technology stack.

## Step 2: Detect Project Stack

Before reviewing, identify the tech stack from the diff and repo structure:

- Languages (JS/TS, Python, Go, Rust, Java, etc.)
- Frameworks (Express, Django, Spring, React, Vue, Angular, etc.)
- Test frameworks (Jest, pytest, go test, JUnit, etc.)
- CI/CD (GitHub Actions, GitLab CI, etc.)
- Package managers, linters, formatters

Adapt the review checklist below to the detected stack. Skip irrelevant categories.

## Step 3: Review Checklist (Adapt to Stack)

For EVERY file in the diff, evaluate against these categories:

### Security (All Stacks)

- **Injection**: SQL, command, template, CSV formula, LDAP, XPath — any user input reaching a sink without sanitization
- **Path traversal**: user input in file paths without allowlist or sanitization
- **Authentication/Authorization**: missing auth middleware, broken access control, privilege escalation
- **Secrets exposure**: `err.message`/stack traces leaked to client, hardcoded credentials, sensitive data in logs or responses
- **Input validation**: missing type checks, unbounded input sizes, unvalidated enums
- **Deserialization**: unsafe `JSON.parse`, `pickle.loads`, `eval`, `yaml.load` without safe loader
- **Dependencies**: known vulnerable packages, unpinned versions in security-critical contexts
- **OWASP Top 10**: XSS, CSRF, SSRF, broken auth, security misconfiguration, etc.

### Performance & Reliability

- **Resource exhaustion**: full-file reads into memory, unbounded loops/queries, missing pagination, no connection pooling
- **Blocking operations**: synchronous I/O in async contexts (Node.js `*Sync`, Python blocking in async, etc.)
- **Memory leaks**: uncleared timers, unsubscribed listeners, unclosed connections/handles, growing caches without eviction
- **Concurrency**: race conditions, missing locks, shared mutable state, non-atomic operations
- **N+1 queries**: database queries inside loops (any ORM)

### Error Handling

- **Silent failures**: empty catch blocks, errors swallowed without logging, API failures shown as "no data"
- **Missing error states**: no user feedback on failure, loading states absent
- **Incorrect status codes**: HTTP 200 for errors, generic 500 without context
- **Crash risk**: unhandled promise rejections, uncaught exceptions, panic without recovery

### Code Quality

- **Duplication**: identical functions/logic across files — should be extracted to shared module
- **Dead code**: unused imports, unreachable branches, commented-out code, functions defined but never called
- **Naming**: misleading variable/function names, inconsistent conventions
- **Complexity**: functions doing too many things, deeply nested conditionals, god objects/classes
- **Consistency**: mixed patterns for the same concern (e.g., different error handling across similar routes)

### API & Interface Design

- **RESTful conventions**: proper HTTP methods, resource naming, status codes
- **Response consistency**: inconsistent envelope format across endpoints
- **Breaking changes**: removed or renamed fields/endpoints without versioning
- **Documentation**: missing OpenAPI/Swagger annotations for public APIs
- **Backward compatibility**: duplicate routes with inconsistent validation, deprecated paths without migration

### Frontend (When Applicable)

- **Framework-specific anti-patterns**:
  - React: missing keys, stale closures, side effects in render/updater functions, missing cleanup in useEffect
  - Vue: mutating props, missing reactive declarations
  - Angular: missing unsubscribe, change detection issues
- **State management**: API calls on every keystroke (missing debounce), unnecessary re-renders, prop drilling
- **Accessibility (a11y)**: missing labels, ARIA attributes, keyboard navigation, color contrast (WCAG AA), `prefers-reduced-motion`
- **CSS/Styling**: hardcoded values instead of variables/tokens, `@import` order issues, FOUC (theme flash), inline style object recreation per render
- **Downloads/Exports**: `window.open` without error handling, missing `Content-Disposition` headers

### Tests (When Present)

- **Coverage**: critical paths untested (auth, payments, destructive actions, exports)
- **Assertion quality**: tests that only check status code but not response body/headers
- **Mocking fidelity**: mocks that replace real behavior entirely (test passes but production breaks)
- **Isolation**: shared mutable state between tests, missing cleanup, order-dependent tests
- **Edge cases**: invalid input, empty data, concurrent access, error paths
- **Flakiness risk**: timing-dependent assertions, port conflicts, race conditions

### CI/CD & Infrastructure (When Present)

- **Completeness**: missing lint, audit, type-check, or security scan steps
- **Correctness**: wrong working directories, missing env vars, incorrect triggers
- **Performance**: missing dependency caching, unnecessary full rebuilds
- **Security**: secrets in plain text, overly permissive permissions

## Step 4: Classify Issues

Assign severity to every finding:

| Severity     | Criteria                                                     | Examples                                                                         |
| ------------ | ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| **CRITICAL** | Security vulnerability, data loss, or system compromise risk | Unvalidated input in queries, missing auth, credential exposure                  |
| **HIGH**     | Will cause production problems or degrade reliability        | Memory leaks, DoS vectors, silent data corruption, missing error feedback        |
| **MEDIUM**   | Code quality, maintainability, or correctness concern        | Duplicated code, weak test assertions, accessibility gaps, inconsistent patterns |
| **LOW**      | Minor improvement or style issue                             | Missing charset, RFC non-compliance, naming inconsistency                        |

## Step 5: Present Review to User

Format the review as:

```markdown
# Code Review: PR #N — <title>

**X archivos** | +adds / -dels | N commits por <author>

---

## Resumen

<2-3 sentences on what the PR does and overall assessment>

---

## CRITICAL (N)

### 1. <title>

**`file:line`**
<explanation with code snippet>
**Fix:** <concrete recommendation with code>

## HIGH (N)

| #   | File | Issue |
| --- | ---- | ----- |

<table rows>

## MEDIUM (N)

| #   | Area | Issue |
| --- | ---- | ----- |

<table rows>

## LOW (N)

<table format>

## Positive Aspects

<bullet list of things done well — ALWAYS include this section>

## Verdict

<One of: Mergeable / Mergeable with minor fixes / Do not merge yet>
<Prioritized list of what must be fixed before merge>
```

## Step 6: Post to GitHub

Ask the user if they want the review posted to the PR. If yes:

- Never post the review to GitHub without explicit confirmation from the user. Always ask first.
- Try `gh pr review <number> --request-changes --body "..."` first
- If it fails (e.g., own PR), fall back to `--comment`
- Use HEREDOC (`cat <<'EOF'`) for the body to preserve formatting
- In case of posting the review always do it in a comment and never include a signature or any reference to the fact that it was generated by an AI. The comment should be as if it was written by a human reviewer.

## Step 7: Re-review Flow (When Fixes Are Ready)

If the user says fixes are ready:

1. Fetch new commits: `gh pr view <number> --json commits`
2. Diff ONLY the fix commit(s) against the previous state: `git diff <old-sha>..<new-sha>`
3. Go through EVERY issue from the original review and mark:
   - ✅ FIXED
   - ⚠️ PARTIALLY FIXED (explain what's still missing)
   - ❌ NOT FIXED
4. Check for NEW issues introduced by the fix
5. Present a scorecard table with counts and updated verdict
6. Post follow-up review if user confirms

## Important Notes

- **SOLO REVIEW: Nunca hacer checkout de la rama ni modificar código. Este skill es exclusivamente para revisar y comentar, no para corregir. Si el usuario pide correcciones, debe hacerlo en un paso separado fuera de este skill.**
- Always review the FULL diff — patterns across files matter (duplicated utils, inconsistent error handling)
- For fix commits, diff between specific commits, not the full PR diff
- Be specific: include file paths, line references, and code snippets
- Provide concrete fix recommendations with code, not just problem descriptions
- Always note positive aspects — good patterns should be recognized
- Adapt language to the user's preference (if they write in Spanish, review in Spanish)
- Consider project context: a trading bot dashboard has different risk tolerance than a blog

## MANDATORY: ALL REVIEWS MUST BE DONE IN SPANISH, regardless of the language used in the code, this very file or PR description. This ensures consistency and accessibility for all team members.
