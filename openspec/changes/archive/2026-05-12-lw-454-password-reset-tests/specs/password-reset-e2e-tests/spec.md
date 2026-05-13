## ADDED Requirements

### Requirement: E2E helper endpoint — inject reset token

The backend MUST expose `POST /testing/inject-reset-token` when `E2E_TESTING=true`. The endpoint SHALL accept `{ email: string }`, invalidate any existing unused token for that user, create a new `PasswordResetToken` with a deterministic raw token value, and return `{ rawToken: string }`. This endpoint SHALL NOT be reachable when `E2E_TESTING` is falsy.

#### Scenario: Returns raw token for known user

- **GIVEN** `E2E_TESTING=true` and a seeded user with `email: 'e2e_coach@lightweight.test'`
- **WHEN** `POST /testing/inject-reset-token` is called with `{ email: 'e2e_coach@lightweight.test' }`
- **THEN** the response is `200 OK` with body `{ rawToken: '<hex string>' }`
- **AND** a `PasswordResetToken` row exists with `token = sha256(rawToken)`, `used = false`, `expiresAt` ~30 min from now

#### Scenario: Invalidates previous token before inserting

- **GIVEN** the user already has an unused `PasswordResetToken`
- **WHEN** `POST /testing/inject-reset-token` is called again for the same email
- **THEN** the previous token is marked `used = true`
- **AND** only the newly injected token is valid

#### Scenario: Endpoint blocked when E2E_TESTING is not set

- **GIVEN** the backend is started without `E2E_TESTING=true`
- **WHEN** `POST /testing/inject-reset-token` is called
- **THEN** the response is `404 Not Found`

---

### Requirement: E2E fixture — users include email field

The `e2eUsers` fixture in `e2e/fixtures/users.ts` MUST include an `email` field for each user. The `/testing/reset` seed endpoint MUST populate the `email` column using those values.

#### Scenario: e2e_coach email is deterministic

- **GIVEN** the E2E suite runs `POST /testing/reset`
- **WHEN** `prismaMock.user.findUnique({ where: { email: 'e2e_coach@lightweight.test' } })` is called
- **THEN** the user is found

#### Scenario: E2eUser type includes email

- **GIVEN** the TypeScript type `E2eUser`
- **WHEN** the type is inspected
- **THEN** it has properties `username: string`, `password: string`, `role: 'COACH' | 'CLIENT'`, `email: string`

---

### Requirement: E2E happy-path — full forgot-password → reset-password → login flow

A Playwright test SHALL drive the complete browser flow: navigate to `/forgot-password`, submit email, obtain token via inject endpoint, navigate to `/reset-password?token=...`, set new password, verify redirect to `/login`, and log in successfully with the new password.

#### Scenario: Visitor completes full password reset flow

- **GIVEN** the DB is seeded with `e2e_coach` having email `e2e_coach@lightweight.test`
- **WHEN** the visitor navigates to `/forgot-password`, enters `e2e_coach@lightweight.test`, and submits
- **THEN** a generic success message or toast is visible (the UI does not reveal whether the email exists)
- **AND** `POST /testing/inject-reset-token` returns a `rawToken`
- **WHEN** the visitor navigates to `/reset-password?token=<rawToken>` and enters `NewE2ePass123!` in both password fields and submits
- **THEN** a success toast is displayed and the page redirects to `/login`
- **WHEN** the visitor logs in with `e2e_coach` and `NewE2ePass123!`
- **THEN** the login succeeds and the coach dashboard is visible

#### Scenario: Submit button disabled while request is in flight

- **GIVEN** the visitor is on `/forgot-password`
- **WHEN** the visitor submits the form
- **THEN** the submit button is disabled until the API response is received

---

### Requirement: E2E error cases — ForgotPassword page

The Playwright suite SHALL verify all error paths on the `/forgot-password` page without relying on real SMTP.

#### Scenario: Unregistered email shows inline error

- **GIVEN** the visitor is on `/forgot-password`
- **WHEN** the visitor submits with `notreal@example.com`
- **THEN** an inline error is visible below the email field
- **AND** the page does NOT navigate to `/login`

#### Scenario: Invalid email format — browser/client validation

- **GIVEN** the visitor is on `/forgot-password`
- **WHEN** the visitor submits with `not-an-email`
- **THEN** a validation error is shown and no API call is made (or the API returns 400 and the error is displayed)

---

### Requirement: E2E error cases — ResetPassword page

The Playwright suite SHALL verify all error paths on the `/reset-password` page.

#### Scenario: Mismatched passwords — client-side validation blocks submission

- **GIVEN** the visitor navigates to `/reset-password?token=<validToken>`
- **WHEN** the visitor enters `Pass1234!` in the first field and `Diferente!` in the second and submits
- **THEN** a client-side validation error is shown
- **AND** no `POST /auth/reset-password` call is made

#### Scenario: Password too short — client-side validation blocks submission

- **GIVEN** the visitor is on `/reset-password?token=<validToken>`
- **WHEN** the visitor enters `short` in both password fields and submits
- **THEN** a client-side validation error is shown (minimum 8 characters)

#### Scenario: Expired token — backend returns 400, error and retry link shown

- **GIVEN** a `PasswordResetToken` exists with `expiresAt` in the past (injected via test helper with manipulated expiry)
- **WHEN** the visitor submits the form with that token
- **THEN** an error message is visible
- **AND** a link to `/forgot-password` is present on the page

#### Scenario: Already-used token — backend returns 400, error shown

- **GIVEN** a token that was already consumed (inject then use it once, then try again)
- **WHEN** the visitor submits the form with the used token
- **THEN** an error message is visible
- **AND** a link to `/forgot-password` is present

#### Scenario: ResetPassword page is publicly accessible without JWT

- **GIVEN** the visitor has no JWT in localStorage
- **WHEN** the visitor navigates to `/reset-password?token=abc`
- **THEN** the reset password form is rendered (no redirect to `/login`)

---

### Requirement: E2E CI integration

The new E2E tests SHALL be executed automatically in the GitHub Actions CI pipeline alongside the existing Playwright suite. No additional SMTP credentials SHALL be required because the inject endpoint bypasses email delivery.

#### Scenario: CI runs forgot-password tests automatically

- **GIVEN** the GitHub Actions E2E workflow starts the backend with `E2E_TESTING=true`
- **WHEN** Playwright discovers `e2e/tests/forgot-password.spec.ts`
- **THEN** all tests in that file are executed as part of the CI run
- **AND** the workflow does NOT require `MAIL_USER`, `MAIL_OAUTH_CLIENT_ID`, `MAIL_OAUTH_CLIENT_SECRET`, or `MAIL_OAUTH_REFRESH_TOKEN` to pass
