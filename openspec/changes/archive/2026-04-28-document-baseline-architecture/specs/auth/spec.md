## ADDED Requirements

### Requirement: User registration

The system SHALL allow a Visitant to register a new account by `POST /auth/register` with `{ username, email, password, role }` where `role` is one of `COACH` / `CLIENT`. The system SHALL hash the password with bcrypt (10 rounds) and persist a `User` row. The endpoint SHALL NOT return a JWT.

#### Scenario: Successful registration

- **WHEN** a Visitant POSTs `/auth/register` with `{ username, email, password, role }` where `username` and `email` are both unique, `email` is a valid email, `role` is `COACH` or `CLIENT`
- **THEN** the system creates a `User` row with `passwordHash` (bcrypt), `coachId = null`, `createdAt = now()`
- **AND** the response is `201 Created` (default Nest POST status) with body `{ message: "User <username> registered successfully" }`
- **AND** no token is issued; the SPA flow is to redirect the user to `/login`

#### Scenario: Duplicate username or email

- **WHEN** a Visitant POSTs `/auth/register` with a `username` OR `email` that matches any existing user
- **THEN** the response is `409 Conflict` with the NestJS `ConflictException` body `{ message: "Username or email already exists", ... }`
- **AND** no row is created

#### Scenario: Invalid payload

- **WHEN** a Visitant POSTs `/auth/register` missing a required field, with an invalid email, or with `role` not in `{COACH, CLIENT}`
- **THEN** the response is `400 Bad Request` from the global `ValidationPipe` (class-validator)

### Requirement: User login by username

The system SHALL authenticate users via `POST /auth/login` with `{ username, password }` (NOT email). On success the response SHALL include `access_token` (JWT signed with `JWT_SECRET`) and a minimal `user` object.

#### Scenario: Successful login

- **WHEN** a registered user POSTs `/auth/login` with `{ username, password }` matching a stored user
- **THEN** the response is `200 OK` with body `{ access_token: <jwt>, user: { id, username, role, coachId? } }`
- **AND** the JWT payload contains exactly `{ userId: user.id, role: user.role }` (note: `userId`, not `sub`)
- **AND** `coachId` is included only when not null

#### Scenario: Wrong password

- **WHEN** a user POSTs `/auth/login` with the correct username but a wrong password
- **THEN** the response is `401 Unauthorized` with the generic message `"Invalid credentials"`

#### Scenario: Unknown username

- **WHEN** anyone POSTs `/auth/login` with a username that does not exist
- **THEN** the response is also `401 Unauthorized` with `"Invalid credentials"` (same message — does NOT leak account existence)

#### Scenario: Email used in place of username

- **WHEN** anyone POSTs `/auth/login` with `{ username: "<an email>", password }` (the `LoginDto` has no `email` field)
- **THEN** the lookup is performed against `User.username` only and the response is `401 Unauthorized` if no `User.username` matches the email string

### Requirement: JWT validation strategy

The system SHALL validate every protected request's `Authorization: Bearer <jwt>` via the Passport `jwt` strategy. The strategy SHALL re-fetch the user from PostgreSQL on every request — the role and `coachId` returned by the strategy come from the DB, not the token, so revoked roles take effect on the next request.

#### Scenario: Strategy returns the live DB user

- **GIVEN** a valid signed JWT carrying `{ userId, role }`
- **WHEN** the request hits any guarded controller
- **THEN** `JwtStrategy.validate` looks up the user by `id = payload.userId`
- **AND** `req.user` is set to `{ userId, username, role, coachId }` sourced from the DB row
- **AND** if the user no longer exists, the response is `401 Unauthorized` with `"User not found"`

#### Scenario: Missing or invalid JWT

- **WHEN** any guarded controller is hit without an `Authorization` header, with a malformed token, or with an expired token
- **THEN** the response is `401 Unauthorized` from the `JwtAuthGuard` / `CoachGuard`

### Requirement: Two backend guards

The system SHALL expose two guards under `src/back/src/auth/guards/`:

- `JwtAuthGuard` (extends `AuthGuard('jwt')`) — authenticates only.
- `CoachGuard` (extends `AuthGuard('jwt')`) — authenticates AND requires `user.role === 'COACH'`. Wrong role returns `403 Forbidden` with `"Only coaches can access this resource"`.

#### Scenario: COACH-only endpoint accessed by a CLIENT

- **WHEN** a CLIENT-authenticated user calls a `@UseGuards(CoachGuard)` endpoint (e.g. `GET /routines`, `GET /routines/clients-options`, `PATCH /invitations/:id/revoke`, `GET /session`)
- **THEN** the response is `403 Forbidden`
- **AND** no side effects occur

#### Scenario: COACH-only endpoint accessed without auth

- **WHEN** an anonymous client calls the same endpoint without `Authorization`
- **THEN** the response is `401 Unauthorized` with `"Invalid or missing token"`

### Requirement: Frontend protected routes

The SPA's `ProtectedRoute` component SHALL gate page navigation by JWT presence and (optionally) role. While restoring the session from `localStorage` it SHALL render a spinner and NOT redirect. Without a session it SHALL redirect to `/login`. With the wrong role it SHALL redirect to that role's home (`/dashboard` for COACH, `/client-home` for CLIENT).

#### Scenario: Anonymous navigation to a protected route

- **GIVEN** no `token` in `localStorage`
- **WHEN** the user navigates to any route wrapped by `<ProtectedRoute>`
- **THEN** the SPA renders `<Navigate to="/login" replace />`

#### Scenario: Role mismatch

- **GIVEN** a CLIENT-authenticated user
- **WHEN** the user navigates to `/dashboard` (wrapped by `<ProtectedRoute requiredRole="COACH">`)
- **THEN** the SPA renders `<Navigate to="/client-home" replace />`
- **AND** symmetrically, a COACH visiting `/client-home` is redirected to `/dashboard`

#### Scenario: Loading state

- **GIVEN** the page just loaded and `AuthContext.isLoading === true`
- **WHEN** any `<ProtectedRoute>` evaluates
- **THEN** it renders a centered spinner (no redirect) until `isLoading` resolves to `false`

### Requirement: Frontend auth state in localStorage

`AuthContext` SHALL persist the authenticated session as separate localStorage keys: `token`, `userRole`, `username`, `userId`, and `coachId` (optional). The `api` axios client interceptor SHALL read `token` from `localStorage` on every request and inject `Authorization: Bearer <token>`. On `401` responses the interceptor SHALL clear `token`, `username`, `userRole`, `userId` and `window.location.href = '/login'`.

#### Scenario: Persisted session restored on reload

- **GIVEN** localStorage has `token`, `userRole`, `username`, `userId`
- **WHEN** the SPA mounts
- **THEN** `AuthContext` exposes `user = { id, username, role, token, coachId? }` after a brief `isLoading=true`

#### Scenario: 401 response clears session

- **GIVEN** the user is logged in
- **WHEN** any `api.*` call returns `401`
- **THEN** the interceptor removes `token`, `username`, `userRole`, `userId` from `localStorage` (note: it does NOT remove `coachId` — minor known gap) and redirects to `/login`

### Requirement: Forgot-password is a UI-only stub

The SPA SHALL expose `/forgot-password` rendering the `ForgotPassword` page, but the page SHALL NOT call any backend endpoint. There is no `/auth/forgot-password` endpoint. The form simply shows `toast.success(messages.resetEmailSent)` and redirects to `/login` after 2 seconds.

**Known gap:** real password recovery requires a future change that introduces (a) a mailer integration, (b) a reset-token mechanism, (c) a `/auth/forgot-password` endpoint, (d) `.env`/`ENV_FILE` updates for the mailer credentials.

#### Scenario: Submitting any email to forgot-password

- **WHEN** a Visitant submits the `ForgotPassword` form with any email
- **THEN** no network request is sent
- **AND** the SPA shows the success toast `t("messages.resetEmailSent")`
- **AND** after ~2 s the user is navigated to `/login`

#### Scenario: Future requirement (out of scope here)

- **WHEN** a follow-up change introduces real password recovery
- **THEN** that change MUST add the endpoint, the mailer, and a token-validated reset form, replacing this stub requirement

### Requirement: Auth UI is fully internationalised

Every user-visible string on `Login`, `Register`, and `ForgotPassword` SHALL come from `ca.json`/`es.json`/`en.json` via `react-i18next`. Currently the localStorage default language is `en` (see the `i18n` capability) — Catalan is selectable but is not the boot default.

#### Scenario: Switching language updates the auth pages

- **GIVEN** a Visitant viewing `/login` in English (default)
- **WHEN** the user picks "ES" in the `LanguageSwitcher`
- **THEN** all labels, placeholders, error toasts, and submit buttons re-render with the Spanish strings from `es.json`
- **AND** the chosen language is stored as `localStorage.language = "es"` and survives reloads

### Requirement: Auth flow is testable

The auth flow SHALL be exercisable end-to-end in development without third-party services.

#### Scenario: Manual QA path

- **WHEN** a developer runs the registration → login → API `me` (via `/auth/login` response) → logout flow against `http://localhost:5173` with `docker compose up`
- **THEN** the steps documented in `doc/Proves_usuari.md` (Auth section) all pass
- **AND** any new automated coverage SHALL be added as a `*.spec.ts` co-located in `src/back/src/auth/` using `@nestjs/testing` with a mocked `PrismaService` and a stubbed `JwtService.sign`
