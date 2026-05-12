## 1. Backend — Unit Tests (AuthService)

- [x] 1.1 Extend `prismaMock` in `src/back/src/auth/auth.service.spec.ts` to add `passwordResetToken: { create, updateMany, findFirst, update }` mock methods
- [x] 1.2 Add `ConfigService` mock to the `TestingModule` returning `'30'` for `RESET_TOKEN_EXPIRY_MINUTES` and `'http://localhost:5173'` for `FRONTEND_URL`
- [x] 1.3 Add `MailService` mock to the `TestingModule` with `sendPasswordReset: vi.fn()` via `overrideProvider`
- [x] 1.4 Write `describe('forgotPassword')` block with test: known email → `updateMany` called + `create` called + mail sent
- [x] 1.5 Write test: unknown email → `NotFoundException` thrown, `create` and `sendPasswordReset` NOT called
- [x] 1.6 Write test: existing unused token invalidated before new token created (call order assertion on `updateMany` vs `create`)
- [x] 1.7 Write test: `RESET_TOKEN_EXPIRY_MINUTES=60` → `expiresAt` ≈ 60 min from `Date.now()` (use `vi.useFakeTimers`)
- [x] 1.8 Write test: stored token is SHA-256 hex of the raw value (capture `create` call args)
- [x] 1.9 Write `describe('resetPassword')` block with test: valid token → `user.update` called with bcrypt hash + `passwordResetToken.update` sets `used: true`
- [x] 1.10 Write test: `findFirst` returns `null` → `BadRequestException` with message `'Invalid or expired token'`
- [x] 1.11 Write test: already-used token scenario (simulate `findFirst` returning null because of `used: false` filter)
- [x] 1.12 Write test: token lookup uses SHA-256 hash of the raw input (capture `where.token` passed to `findFirst`)
- [x] 1.13 Run `npm test` inside `src/back/` and confirm all new tests pass

## 2. Backend — Test-Only Endpoint

- [x] 2.1 Locate the existing `TestingController` / `TestingModule` in `src/back/src/` (search for `testing/reset` handler)
- [x] 2.2 Add `POST /testing/inject-reset-token` handler that accepts `{ email: string }`, invalidates existing unused tokens for that user, creates a new `PasswordResetToken` with a `randomBytes(32).toString('hex')` raw token, and returns `{ rawToken: string }`
- [x] 2.3 Ensure the new endpoint is guarded by the same `E2E_TESTING` check as `POST /testing/reset`
- [x] 2.4 Run `npm run build` inside `src/back/` to confirm no TypeScript errors
- [x] 2.5 Manual smoke: start backend with `E2E_TESTING=true`, call `POST /testing/inject-reset-token` with a seeded email, verify `{ rawToken }` returned and DB row exists

## 3. E2E — Fixture Updates

- [x] 3.1 Add `email: string` to the `E2eUser` type in `e2e/fixtures/users.ts`
- [x] 3.2 Add `email` values to `e2eUsers`: `e2e_coach@e2e.local`, `e2e_client_linked@e2e.local`, `e2e_client_unlinked@e2e.local`
- [x] 3.3 Update the `/testing/reset` seed handler in the backend `TestingController` to populate the `email` column when creating e2e users (already done in e2e-seed.ts)
- [x] 3.4 Verify `POST /testing/reset` seeds users with correct emails by querying the DB via Adminer

## 4. E2E — Playwright Tests

- [x] 4.1 Create `e2e/tests/forgot-password.spec.ts` with a `beforeEach` that calls `resetDatabase()` to seed fresh state
- [x] 4.2 Write happy-path test: navigate to `/forgot-password` → submit email → verify confirmation → inject token → navigate to `/reset-password?token=<rawToken>` → submit new password → verify redirect to `/login` → login with new credentials → verify dashboard visible
- [x] 4.3 Write test: submit button is disabled while request is in flight (intercept network with `page.route` and assert button state)
- [x] 4.4 Write test: unregistered email (`notreal@example.com`) → inline error visible, no redirect to `/login`
- [x] 4.5 Write test: mismatched passwords on ResetPassword page → client-side error shown, no API call made
- [x] 4.6 Write test: password too short → client-side error shown, no API call made
- [x] 4.7 Write test: expired token → inject token, manipulate `expiresAt` via direct DB call or inject endpoint with short expiry param → submit → error message + link to `/forgot-password`
- [x] 4.8 Write test: already-used token → consume token once via API, then submit again → error message + link to `/forgot-password`
- [x] 4.9 Write test: `/reset-password?token=abc` renders form without JWT in localStorage (no redirect to `/login`)
- [x] 4.10 Run Playwright suite locally: `cd e2e && npx playwright test forgot-password.spec.ts` and confirm all tests pass

## 5. CI Verification

- [x] 5.1 Confirm the GitHub Actions E2E workflow (`.github/workflows/`) starts the backend with `E2E_TESTING=true` — no changes needed if already set
- [x] 5.2 Push branch and verify the CI run discovers and passes `forgot-password.spec.ts` without SMTP credentials in the secrets

## 6. Verification & Cleanup

- [x] 6.1 Run `npm run lint` inside `src/back/` — zero new errors (pre-existing lint issues unchanged)
- [x] 6.2 Run `npm run build` inside `src/back/` — build errors are pre-existing in room.gateway.ts; our files have no TS errors
- [x] 6.3 Run `npm test` inside `src/back/` — all 15 auth.service.spec.ts tests green
- [x] 6.4 Run full E2E suite locally (`cd e2e && npx playwright test`) — no regressions in existing tests
- [x] 6.5 Add manual QA step to `doc/Proves_usuari.md`: "Forgot password flow: request reset, use token link, set new password, login successfully"
