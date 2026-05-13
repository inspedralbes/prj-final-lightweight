## Why

LW-453 implemented the complete password reset flow (backend endpoints, Prisma model, MailService, frontend pages) but shipped with no automated test coverage. LW-454 closes that gap by adding both unit tests (Vitest / Jest) for the backend service logic and E2E tests (Playwright) for the full browser → API → DB flow, ensuring the reset feature is verified in CI on every PR.

## What Changes

- Add unit tests for `AuthService.forgotPassword` and `AuthService.resetPassword` covering all spec scenarios (token generation, hashing, expiry, used-token guard, bcrypt update, generic response for unknown emails).
- Add unit tests for `MailService` mock injection to verify testability without SMTP.
- Add a new Playwright E2E test file `e2e/tests/forgot-password.spec.ts` covering the happy path and all error cases defined in the spec (expired token, used token, mismatched passwords, unknown email).
- Extend `e2e/fixtures/users.ts` with an e2e user that has a known email for password reset scenarios.
- Integrate the new E2E tests into the existing GitHub Actions CI pipeline alongside the current E2E suite.

## Capabilities

### New Capabilities

- `password-reset-unit-tests`: Unit test suite for `AuthService` (forgotPassword / resetPassword) using Vitest + NestJS TestingModule with mocked Prisma and MailService.
- `password-reset-e2e-tests`: Playwright E2E test suite for the forgot-password → reset-password → login flow, including error paths and SMTP interception via Ethereal.

### Modified Capabilities

- `auth`: Existing unit test file `auth.service.spec.ts` gains new `describe` blocks for `forgotPassword` and `resetPassword`; no spec-level requirement changes.
- `e2e-testing`: New test file added to the existing Playwright suite; CI job configuration may need an environment variable for Ethereal SMTP interception.

## Impact

- **Backend**: `src/back/src/auth/auth.service.spec.ts` — new test cases added. No production code changes.
- **E2E**: `e2e/tests/forgot-password.spec.ts` — new file. `e2e/fixtures/users.ts` — extended with email field for reset scenarios.
- **CI**: `.github/workflows/` — may need `SMTP_CAPTURE` env var or Ethereal account env vars for E2E token extraction.
- **No Socket.IO impact** — password reset flow is stateless HTTP only.
- **No new dependencies** — Vitest and Playwright are already configured; `nodemailer` is already in the backend for MailService.
- **Testing note**: The unit tests must mock `MailService` via NestJS `overrideProvider` to avoid SMTP calls; E2E tests capture the reset token via the backend `/testing/reset` endpoint response or by seeding it directly in the DB fixture.

**Jira**: LW-454 (Story) — Epic: LW-436 (Implementació de estratègia de testing E2E + unitaris)
