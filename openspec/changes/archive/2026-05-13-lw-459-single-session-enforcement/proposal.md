## Why

Currently, the login endpoint does not check for existing active sessions, allowing the same user account to be authenticated simultaneously from multiple browsers or devices. This is a security and data integrity bug (LW-459, Epic LW-411) — concurrent sessions create inconsistent real-time state (Socket.IO rooms, co-op session presence, chat read receipts) and violate the expected single-user-context model of the platform.

## What Changes

- The `auth` backend module will track a single active session token per user (stored in the `User` table or an in-memory/Redis map).
- On login, if an active session already exists for the account, the request is rejected with HTTP 409 and a clear error message.
- On logout (`POST /api/auth/logout`), the active session record for the user is cleared.
- On Socket.IO `disconnect` event (EventsGateway), if the disconnecting socket belongs to the active session token, the session is also cleared after a configurable timeout (to handle reconnects gracefully).
- The frontend login flow surfaces the new 409 error with an appropriate i18n message.

## Capabilities

### New Capabilities

- `single-session-enforcement`: Ensures only one active session per user at a time — enforced at login and cleared on logout or socket disconnection timeout.

### Modified Capabilities

- `auth`: Login now rejects concurrent sessions; logout now clears the active session record. The existing auth spec requirements around login/logout behavior are extended.

## Impact

**Backend (`src/back/src/`):**
- `auth` module — `AuthService.login()` must check and set active session; `AuthService.logout()` must clear it. New `POST /api/auth/logout` endpoint (or update existing) required.
- `events` module — `EventsGateway` must handle `disconnect` and schedule session clearance after timeout (configurable via env var `SESSION_DISCONNECT_TIMEOUT_MS`, default 30 000 ms).
- Prisma schema — Add `activeSessionToken String?` field to the `User` model (nullable; set on login, cleared on logout/disconnect).
- New migration required under `src/back/prisma/migrations/`.

**Frontend (`src/front/src/features/auth`):**
- Login service / page must handle HTTP 409 and display i18n key `auth.errors.sessionAlreadyActive` ("Ja tens una sessió activa" / "Ya tienes una sesión activa" / "You already have an active session").
- Logout action (AuthContext) must call the logout endpoint to ensure server-side session clearance.
- i18n: add `auth.errors.sessionAlreadyActive` to `ca.json`, `es.json`, `en.json`.

**Socket.IO impact:**
- No new events. Existing `disconnect` event in `EventsGateway` is augmented with session-clearance logic.
- Room `user:{userId}` unaffected in protocol; the gateway will call `AuthService.clearSession(userId)` internally on disconnect timeout.

**Testing note:**
- Backend: add Jest unit tests on `AuthService` for login-with-active-session (expect 409) and logout/clearSession paths.
- E2E: extend `e2e-auth-flow` spec with a concurrent-session scenario.
- No new React context or gateway introduced; existing singletons (EventsGateway, AuthContext) are extended.
