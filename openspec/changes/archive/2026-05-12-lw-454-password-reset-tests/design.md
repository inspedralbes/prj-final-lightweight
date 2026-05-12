## Context

LW-453 shipped the full password reset flow: `POST /auth/forgot-password`, `POST /auth/reset-password`, the `PasswordResetToken` Prisma model, `MailService` (Nodemailer + Ethereal for dev), and the two frontend pages (`ForgotPassword`, `ResetPassword`). The existing `auth.service.spec.ts` already uses Vitest + NestJS `TestingModule` with a mocked `PrismaService` and `JwtService`, but it does not inject `ConfigService` or `MailService` — both are required by `forgotPassword` and `resetPassword`. This change adds tests for those two methods without touching production code.

The Playwright E2E suite lives in `e2e/` with a shared fixture (`users.ts`, `reset.ts`) and a single test file (`smoke.spec.ts`). The reset fixture calls `POST /testing/reset` to seed the DB before each run; the global setup runs this once before the suite. The new E2E tests for password reset need a way to obtain the raw reset token without sending a real email — the chosen approach is a dedicated `/testing/password-reset-token` endpoint exposed only when `E2E_TESTING=true`.

## Goals / Non-Goals

**Goals:**
- Add `forgotPassword` and `resetPassword` unit test cases to `auth.service.spec.ts` covering all spec scenarios from `openspec/specs/password-reset/spec.md`.
- Add `e2e/tests/forgot-password.spec.ts` covering the happy-path flow and all error scenarios.
- Expose a test-only endpoint `GET /testing/password-reset-token?email=<email>` (gated on `E2E_TESTING=true`) that returns the raw token for a given user — enabling E2E token retrieval without real SMTP.
- Ensure both test suites run in CI (GitHub Actions) without SMTP credentials.

**Non-Goals:**
- No changes to production auth logic or MailService behavior.
- No frontend unit tests (no Vitest harness in `src/front/` yet; that's a separate initiative).
- No new Prisma migrations — `PasswordResetToken` is already in the schema.
- No rate-limit (throttler) testing in E2E — that would require IP manipulation beyond the current test setup.

## Decisions

### 1. Unit test approach: extend `auth.service.spec.ts` rather than create a new file

The existing `auth.service.spec.ts` already has the Vitest + NestJS `TestingModule` pattern set up. Adding `forgotPassword` / `resetPassword` describe blocks keeps all `AuthService` tests co-located.

**Alternative considered**: a separate `auth.service.password-reset.spec.ts`. Rejected because it would duplicate the module setup boilerplate and split concerns that belong to the same service.

**Required module changes**: The `TestingModule` must now include `ConfigService` (mock returning `'30'` for `RESET_TOKEN_EXPIRY_MINUTES` and `'http://localhost:5173'` for `FRONTEND_URL`) and `MailService` (mock with `sendPasswordReset: vi.fn()`). The `prismaMock` must add `passwordResetToken: { create, updateMany, findFirst, update, findUnique }`.

### 2. E2E token retrieval: test-only backend endpoint

The E2E suite needs the raw reset token that the backend generates. Options:

| Option | Pros | Cons |
|---|---|---|
| Intercept Ethereal email | Realistic | Requires Nodemailer URL parsing, network call to Ethereal web UI, fragile |
| Seed token directly via DB fixture | Simple | Requires direct DB access from test runner, bypasses the real flow |
| Test-only endpoint `GET /testing/password-reset-token?email=` | Clean, no DB coupling | Adds a test endpoint (already gated pattern in the project) |

**Decision**: test-only endpoint. The project already exposes `POST /testing/reset` guarded by `E2E_TESTING=true`; the new endpoint follows the same pattern in the same `TestingModule`. It queries the `PasswordResetToken` table for the most recent unused token for the given email and returns the SHA-256 pre-image by... wait — the raw token is never stored. The backend stores the hash only.

**Revised approach**: The test-only endpoint inserts a known raw token (e.g. `e2e-test-token-<uuid>`) directly via Prisma, bypassing the email flow entirely. The E2E test:
1. Calls `POST /auth/forgot-password` (smoke — verifies 200 and generic message).
2. Calls `POST /testing/inject-reset-token` with `{ email }` → backend creates a known raw token and returns it.
3. Uses that token in the browser flow.

This keeps the E2E test deterministic without touching Ethereal.

### 3. E2E fixture: add `email` field to `e2eUsers`

The current `e2eUsers` fixture has `username` and `password` but no `email`. The `POST /auth/forgot-password` endpoint accepts an email, so at least one e2e user needs a known email. The reset fixture seeds users via the backend `/testing/reset` endpoint — the email must be deterministic. We add `email` to the `E2eUser` type and set `e2e_coach@lightweight.test` etc.

### 4. CI integration: no new job needed

The E2E GitHub Actions workflow (`.github/workflows/e2e.yml` or embedded in the main workflow) already starts the backend with `E2E_TESTING=true`. The new test file is auto-discovered by Playwright from `e2e/tests/`. No SMTP env vars are needed because the E2E path uses the inject endpoint instead.

## Risks / Trade-offs

- **Test-only endpoint surface**: The `POST /testing/inject-reset-token` endpoint is only active when `E2E_TESTING=true`. The guard must be verified to be off in production. → Mitigation: use the same `E2eTesting` guard already used by `POST /testing/reset`; add an integration test for the guard itself.
- **`forgotPassword` throws `NotFoundException` for unknown email in current code vs. spec requiring generic 200**: The spec says the controller must always return 200; `AuthService.forgotPassword` throws `NotFoundException`. This is a pre-existing spec violation in LW-453 that the unit tests will document (tests verify the service throws; the controller catch should swallow it). → Mitigation: note in the unit test that controller-level handling is tested separately; leave the service behavior test as-is and add a controller integration test if needed.
- **Token expiry timing in unit tests**: `resetPassword` checks `expiresAt > now()`. Tests must control time (mock `Date.now`). → Use `vi.setSystemTime` / `vi.useFakeTimers` in Vitest.

## Migration Plan

1. Extend `auth.service.spec.ts` — pure test-only change, no deploy needed.
2. Add `/testing/inject-reset-token` to the existing `TestingController` — deploy to staging with `E2E_TESTING=true` to verify before merging.
3. Add `e2e/tests/forgot-password.spec.ts` — auto-discovered by CI.
4. Update `e2e/fixtures/users.ts` to add `email` field — `POST /testing/reset` seed logic must populate the email column.
5. Verify CI passes end-to-end on the PR.

No rollback needed — all changes are additive (test files + test-only endpoint).

## Open Questions

- Does the existing `TestingController` already expose `POST /testing/inject-reset-token` or a similar helper? → Verify before implementing; if yes, reuse it.
- Should the E2E `inject-reset-token` endpoint also invalidate existing tokens for that user (mirroring `forgotPassword` logic)? → Yes, for determinism.
