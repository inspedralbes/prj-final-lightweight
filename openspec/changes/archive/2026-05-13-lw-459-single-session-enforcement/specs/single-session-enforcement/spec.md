## ADDED Requirements

### Requirement: Login rejects concurrent active session

The system SHALL prevent a user from logging in when they already have an active session token stored in the database. The system SHALL return HTTP 409 with a localised error message.

#### Scenario: Login blocked when active session exists (COACH)

- **GIVEN** a COACH user has an active session (their `activeSessionToken` is non-null in the DB)
- **WHEN** the same user submits valid credentials via `POST /api/auth/login` from a second browser
- **THEN** the system returns HTTP 409 with body `{ "statusCode": 409, "message": "Session already active" }` and does NOT overwrite the existing `activeSessionToken`

#### Scenario: Login blocked when active session exists (CLIENT)

- **GIVEN** a CLIENT user has an active session
- **WHEN** the same user attempts login from any other device
- **THEN** the system returns HTTP 409 and the existing session remains intact

#### Scenario: Login succeeds when no active session exists

- **GIVEN** a user with valid credentials and `activeSessionToken = null`
- **WHEN** the user submits `POST /api/auth/login`
- **THEN** the system returns HTTP 200 with `{ "access_token": "...", "user": { ... } }` and stores the issued token in `user.activeSessionToken`

#### Scenario: Frontend displays i18n error on 409

- **GIVEN** the login page is open in Catalan locale
- **WHEN** the server responds with HTTP 409
- **THEN** the page displays "Ja tens una sessió activa en un altre dispositiu" in an error alert element

#### Scenario: Frontend displays i18n error in Spanish locale

- **GIVEN** the login page is open in Spanish locale
- **WHEN** the server responds with HTTP 409
- **THEN** the page displays "Ya tienes una sesión activa en otro dispositivo"

#### Scenario: Frontend displays i18n error in English locale

- **GIVEN** the login page is open in English locale
- **WHEN** the server responds with HTTP 409
- **THEN** the page displays "You already have an active session on another device"

---

### Requirement: Logout releases the active session

The system SHALL expose a `POST /api/auth/logout` endpoint (JWT-guarded) that clears the caller's `activeSessionToken`, making the account available for login on any device.

#### Scenario: Logout clears active session

- **GIVEN** an authenticated user (any role) with a valid JWT
- **WHEN** the user calls `POST /api/auth/logout`
- **THEN** the system sets `user.activeSessionToken = null` in the DB and returns HTTP 200 `{ "message": "Logged out" }`

#### Scenario: After logout, same user can login again

- **GIVEN** a user has just called `POST /api/auth/logout` successfully
- **WHEN** the user immediately submits `POST /api/auth/login` with valid credentials
- **THEN** the system returns HTTP 200 and issues a new token

#### Scenario: Logout without valid JWT is rejected

- **GIVEN** a request to `POST /api/auth/logout` with no Authorization header or an invalid token
- **WHEN** the request is processed
- **THEN** the system returns HTTP 401 Unauthorized

---

### Requirement: Socket.IO disconnect releases the active session after grace period

The system SHALL automatically clear `activeSessionToken` when the user's Socket.IO connection drops, after a 30-second grace period, to allow page refreshes without locking the user out. The frontend SHALL NOT clear localStorage on tab close — session release is handled entirely server-side via this grace period.

#### Scenario: Session cleared after disconnect timeout

- **GIVEN** an authenticated user is connected via Socket.IO with an active session token
- **WHEN** the user's socket disconnects and does not reconnect within 30 seconds
- **THEN** the system clears `user.activeSessionToken = null` and the account is available for login elsewhere

#### Scenario: Session NOT cleared on quick reconnect (page refresh)

- **GIVEN** an authenticated user is connected via Socket.IO
- **WHEN** the socket disconnects and the user reconnects (via `register-user` event) within 30 seconds
- **THEN** the pending clearance timer is cancelled and `activeSessionToken` remains set — the user stays logged in without re-authenticating

#### Scenario: localStorage persists across page refresh

- **GIVEN** an authenticated user with a valid token in localStorage
- **WHEN** the user reloads the page (F5)
- **THEN** the token is still in localStorage after reload and the user is not redirected to login

---

### Requirement: Testability — single-session enforcement

The single-session enforcement logic SHALL be verifiable via automated and manual tests.

#### Scenario: Backend unit test for 409 on concurrent login

- **WHEN** `AuthService.login()` is called with valid credentials and a mocked `PrismaService` that returns a user with non-null `activeSessionToken`
- **THEN** the method throws `ConflictException` (Jest unit test, mocked Prisma)

#### Scenario: Backend unit test for session clearance on logout

- **WHEN** `AuthService.clearSession(userId)` is called
- **THEN** `prisma.user.update({ where: { id: userId }, data: { activeSessionToken: null } })` is invoked exactly once (Jest unit test)

#### Scenario: Manual QA — dual browser test

- **WHEN** a tester logs in with the same account in Chrome and then in Firefox
- **THEN** Chrome session remains active; Firefox shows the 409 error message
- **AND** after logging out in Chrome, the tester can log in successfully in Firefox
