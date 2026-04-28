## ADDED Requirements

### Requirement: Coach issues an invitation

A Coach SHALL be able to issue an invitation to a Client either by generating a shareable code or by directly targeting an existing CLIENT user via username. Each invitation SHALL be persisted with status `PENDING` and a unique `code`.

#### Scenario: Coach generates a shareable code

- **GIVEN** a Coach is authenticated
- **WHEN** the Coach POSTs `/api/invitations` with `{ expiresAt?: "<ISO date>" }` (the field is optional; omitting it leaves `expiresAt = null`)
- **THEN** the system creates an `Invitation` with `coachId = caller`, `targetClientId = null`, `clientId = null`, a UUID `code`, `status = PENDING`, and `expiresAt` equal to the supplied date or `null`
- **AND** the response is `201 Created` with the full invitation object including the `code`

**Known gap:** `POST /api/invitations` is guarded by `JwtAuthGuard` (not `CoachGuard`), so any authenticated user can call it. The service does not validate the caller's role. A follow-up change should add role enforcement at the guard level.

#### Scenario: Coach targets an existing client by username or email

- **GIVEN** a Coach is authenticated and a CLIENT user with `username = "alice"` exists
- **WHEN** the Coach POSTs `/api/clients/invite-by-user` with `{ usernameOrEmail: "alice" }`
- **THEN** the system creates an `Invitation` with `targetClientId` set to alice's id and `status = PENDING`
- **AND** if alice is currently connected, she receives a `coach-invitation` Socket.IO event with `{ coachId, coachName, invitationCode, invitationId }`
- **AND** if alice is NOT connected, the invitation is persisted and she can retrieve it via `GET /api/invitations/pending-for-me` on next login
- **AND** the response is `201 Created` with `{ invitationCode }`

#### Scenario: Direct invite to a non-existent username

- **WHEN** a Coach POSTs `/api/clients/invite-by-user` with a `usernameOrEmail` that matches no user
- **THEN** the response is `404 Not Found`
- **AND** no `Invitation` row is created

#### Scenario: A CLIENT tries to issue a direct invite

- **WHEN** a CLIENT-authenticated user POSTs `/api/clients/invite-by-user`
- **THEN** the response is `403 Forbidden` (the service validates `coach.role !== 'COACH'`)

### Requirement: Client accepts an invitation

A Client SHALL be able to accept a pending invitation either by entering a code or by clicking the inbox entry created by a direct invite. Acceptance SHALL set the client's `coachId` and mark the invitation `ACCEPTED`.

#### Scenario: Accept by code

- **GIVEN** a CLIENT user and a pending invitation with `code = "ABC123"` belonging to coach C
- **WHEN** the CLIENT POSTs `/api/invitations/ABC123/accept` (code is a URL path segment, no body required)
- **THEN** the invitation transitions to `status = ACCEPTED` with `acceptedAt = now()` and `clientId = caller`
- **AND** the caller's `User.coachId` is set to C's id in a single transaction
- **AND** all other `PENDING` invitations targeting the same client are automatically `REVOKED`
- **AND** the response is `200 OK` with the updated invitation object

**Known gap:** The service does not check whether the accepting client already has a `coachId`. If a client with an existing coach accepts a new invitation, their `coachId` will be overwritten. A follow-up change should add a guard against this.

**Known gap:** No socket event is emitted when a client accepts an invitation. The coach is not notified in real time. A follow-up change should add a `coach-invitation-accepted` event.

#### Scenario: Accept an expired or revoked invitation

- **GIVEN** an invitation whose `status` is `REVOKED`, or whose `expiresAt < now()`
- **WHEN** any CLIENT tries to accept it
- **THEN** the response is `400 Bad Request` with message `"Invitation is not usable (status: REVOKED)"` (or `"Invitation has expired"` for the expiry path)
- **AND** for the expiry path the invitation's status is asynchronously updated to `EXPIRED` (fire-and-forget)

### Requirement: Coach revokes a pending invitation

A Coach SHALL be able to revoke a pending invitation they issued. Revocation SHALL set the status to `REVOKED` and prevent future acceptance.

#### Scenario: Successful revoke

- **GIVEN** a Coach C with a pending invitation `INV`
- **WHEN** C POSTs `/api/invitations/:id/revoke`
- **THEN** `INV.status` becomes `REVOKED`
- **AND** the response is `200 OK`

#### Scenario: Revoke an invitation that is not the coach's

- **WHEN** Coach D tries to revoke an invitation issued by Coach C
- **THEN** the response is `403 Forbidden` with message `"You do not own this invitation"`

### Requirement: Invitation list

A Coach SHALL be able to list their issued invitations. A Client SHALL be able to list invitations targeted at them.

#### Scenario: Client lists incoming invitations

- **WHEN** a Client GETs `/api/invitations/pending-for-me`
- **THEN** the response is an array of `{ id, code, coachName, coachId }` for all `PENDING` invitations where `targetClientId = caller`

**Known gap:** There is no `GET /api/invitations` listing endpoint for coaches. Coaches currently have no way to list their own issued invitations via the API. A follow-up change should add this endpoint.

### Requirement: Client rejects a direct invitation

A Client SHALL be able to explicitly reject a pending direct invitation without accepting it. Rejection SHALL set the invitation status to `REVOKED` and prevent future acceptance.

#### Scenario: Successful rejection

- **GIVEN** a Client with a `PENDING` invitation directed at them (`targetClientId = caller`)
- **WHEN** the Client PATCHes `/api/invitations/:id/reject`
- **THEN** the invitation status becomes `REVOKED`
- **AND** the response is `200 OK`

#### Scenario: Reject an invitation not directed at the client

- **WHEN** a Client tries to reject an invitation where `targetClientId ≠ caller`
- **THEN** the response is `403 Forbidden`

### Requirement: Invitation pages are internationalised

All UI strings in the invitation flow (sidebar badge tooltip, inbox entries, accept/reject buttons, error toasts) SHALL exist in `ca.json`, `es.json`, and `en.json`.

#### Scenario: Sidebar badge label

- **WHEN** a Client has 2 pending invitations and language is `es`
- **THEN** the badge tooltip reads the Spanish string from `es.json` (e.g. "2 invitaciones pendientes")

### Requirement: Invitations are testable

Each invitation transition SHALL be exercisable.

#### Scenario: Manual QA + future automated coverage

- **WHEN** a developer follows the "Coach invites Client" steps in `doc/Proves_usuari.md`
- **THEN** the full lifecycle (issue → notify → accept → list link) succeeds
- **AND** a future Jest spec under `src/back/src/invitations/` SHOULD cover create, accept-by-code, reject, revoke, and the expired-invitation case using a mocked `PrismaService`
