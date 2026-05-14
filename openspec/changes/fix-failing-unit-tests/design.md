## Context

The backend test suite (`npm test` via Vitest) has 3 failing tests across 3 files. All failures are in test code, not production code. The fixes are surgical: one structural repair, one assertion correction, and one mock extension.

Current state: 3 failed / 37 passed out of 40 total backend unit tests.

## Goals / Non-Goals

**Goals:**
- Make `npm test` pass with 0 failures in `src/back/`
- Keep all 37 currently-passing tests green
- No changes to production source files

**Non-Goals:**
- Adding new test coverage beyond fixing existing tests
- Changing any runtime behavior of `InvitationsService`, `TestingService`, or `AuthService`
- Frontend test fixes

## Decisions

### Fix 1 — `auth.service.spec.ts`: structural parse error

**Problem**: Vitest/OXC parser fails with `Expected } but found EOF` at line 399. The file ends with `});` but the parser considers a block unclosed. This means there is an unmatched `describe(` or `it(` block somewhere inside the file (opened but never closed).

**Decision**: Read the full file, find the unbalanced brace/parenthesis, and close it. No logic changes.

**Alternative considered**: Rewrite the test file from scratch — rejected, risk of losing existing coverage.

### Fix 2 — `invitations.service.spec.ts`: wrong exception type

**Problem**: The test asserts `rejects.toThrow(BadRequestException)` but the service now throws `ConflictException` (HTTP 409) for the "client already has a coach" case.

**Decision**: Update the test import and assertion to use `ConflictException`. The service behavior is correct; the test is stale.

**Why ConflictException is correct**: HTTP 409 Conflict semantically fits "the resource (coach-client relationship) already exists", which is more precise than 400 Bad Request.

### Fix 3 — `testing.service.spec.ts`: incomplete Prisma mock

**Problem**: `TestingService.reset()` now calls `this.prisma.liveSession.deleteMany(...)` (added when LiveSession cleanup was introduced), but `buildPrismaMock()` only mocks `user`, `routine`, and `invitation`. Accessing `liveSession` on the mock returns `undefined`, causing `Cannot read properties of undefined`.

**Decision**: Add `liveSession: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) }` to both the `PrismaMock` interface and `buildPrismaMock()`. The existing test assertions do not check `liveSession.deleteMany` calls, so the tests pass once the crash is resolved.

## Risks / Trade-offs

- `auth.service.spec.ts` parse error: if the unclosed block is a `describe` wrapping many tests, fixing it may expose additional failures inside that block. Mitigation: run `npm test` after the fix and handle any newly-visible failures.
- No other risks — all changes are confined to `*.spec.ts` files with no production impact.

## Migration Plan

1. Fix `auth.service.spec.ts` — close the unbalanced block
2. Fix `invitations.service.spec.ts` — swap `BadRequestException` → `ConflictException`
3. Fix `testing.service.spec.ts` — extend mock with `liveSession`
4. Run `npm test` in `src/back/` — verify 0 failures
5. Commit: `fix(tests): resolve 3 failing unit tests before prod merge`
