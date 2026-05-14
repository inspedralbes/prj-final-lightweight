## Why

Three unit tests are failing in the backend test suite, blocking a clean `npm test` run before the dev→main merge. The failures are due to a mock gap added when `liveSession` was introduced to `TestingService`, a wrong exception type in `InvitationsService`, and a syntax error in `auth.service.spec.ts`. These must be green before going to production.

## What Changes

- Fix `auth.service.spec.ts`: resolve the parse error (`Expected } but found EOF`) caused by an unclosed `describe` or `it` block somewhere in the file.
- Fix `invitations.service.spec.ts`: update the test that expects `BadRequestException` to expect `ConflictException` (409), matching the current service implementation.
- Fix `testing.service.spec.ts`: add `liveSession: { deleteMany: vi.fn() }` to the `PrismaMock` interface and `buildPrismaMock()` factory so the `reset()` method no longer crashes with `Cannot read properties of undefined`.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `auth`: test file has a structural syntax error — no behavioral change, test-only fix.
- `invitations`: test expectation is misaligned with current service behavior (BadRequest → Conflict) — no behavioral change, test-only fix.

## Impact

- **Backend modules affected**: `auth`, `invitations`, `testing`
- **Files changed**: `src/back/src/auth/auth.service.spec.ts`, `src/back/src/invitations/invitations.service.spec.ts`, `src/back/src/testing/testing.service.spec.ts`
- **No runtime behavior change** — all fixes are in test files only; production code is untouched.
- **No new env vars, migrations, or Socket.IO events.**
- After fix: `npm test` must pass with 0 failures (currently 3 failed / 37 passed out of 40 tests).
