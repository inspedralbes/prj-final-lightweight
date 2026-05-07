# Spec: Progress API

## Purpose

Provides REST endpoints for querying and aggregating workout progress data. Coaches can review their clients' activity summaries and session histories. Clients can view their own session history and aggregated statistics. Session completion metrics are persisted when a session transitions to COMPLETED status.

## Requirements

### Requirement: Coach can list clients with activity summary
The system SHALL provide an endpoint `GET /progress/coach/clients` that returns a list of the authenticated coach's clients, each with the date of their last completed session and total number of completed sessions.

#### Scenario: Coach retrieves client activity list
- **WHEN** a coach sends `GET /progress/coach/clients` with a valid JWT
- **THEN** the system returns HTTP 200 with an array of `{ clientId, username, lastSessionAt, totalSessions }` for each client whose sessions have `coachId` matching the coach's id

#### Scenario: Empty list when coach has no sessions
- **WHEN** a coach with no completed sessions calls `GET /progress/coach/clients`
- **THEN** the system returns HTTP 200 with `{ clients: [] }`

#### Scenario: Unauthenticated request is rejected
- **WHEN** a request is made to `GET /progress/coach/clients` without a JWT
- **THEN** the system returns HTTP 401

#### Scenario: Client role cannot access coach endpoint
- **WHEN** a user with role CLIENT calls `GET /progress/coach/clients` with a valid JWT
- **THEN** the system returns HTTP 403

#### Scenario: Testability — Jest unit
- **WHEN** `ProgressService.getCoachClientsSummary(coachId)` is called with a mocked `PrismaService` that returns two `LiveSession` groups
- **THEN** the method returns an array of two `CoachClientSummaryDto` with correct `totalSessions` counts

---

### Requirement: Coach can view a client's session history
The system SHALL provide an endpoint `GET /progress/coach/client/:clientId` that returns the paginated list of completed sessions for a specific client of the authenticated coach, including routine name, completion date, completion percentage, and completed sets.

#### Scenario: Coach retrieves session history for a valid client
- **WHEN** a coach sends `GET /progress/coach/client/42` and client 42 belongs to that coach
- **THEN** the system returns HTTP 200 with `{ sessions: [{ id, routineName, completedAt, completionPercentage, completedSets }] }` ordered by `completedAt` descending

#### Scenario: Client with no completed sessions returns empty list
- **WHEN** the client has sessions with status PENDING or ACTIVE only
- **THEN** the system returns HTTP 200 with `{ sessions: [] }`

#### Scenario: Coach requests history of a foreign client
- **WHEN** the `clientId` does not belong to the authenticated coach
- **THEN** the system returns HTTP 404

#### Scenario: Unauthenticated request is rejected
- **WHEN** the request has no JWT
- **THEN** the system returns HTTP 401

#### Scenario: Client role cannot access this endpoint
- **WHEN** a CLIENT-role JWT is used
- **THEN** the system returns HTTP 403

#### Scenario: Testability — Jest unit
- **WHEN** `ProgressService.getClientSessionHistory(coachId, clientId)` is called and the mocked Prisma returns no sessions for that coachId
- **THEN** the method throws `NotFoundException`

---

### Requirement: Client can view their own session history
The system SHALL provide an endpoint `GET /progress/client/sessions` that returns the authenticated client's own completed sessions (both solo and co-op), including routine name, completion date, and completion percentage.

#### Scenario: Client retrieves their session list
- **WHEN** a client sends `GET /progress/client/sessions` with a valid JWT
- **THEN** the system returns HTTP 200 with `{ sessions: [{ id, routineName, completedAt, completionPercentage }] }` ordered by `completedAt` descending

#### Scenario: Solo sessions are included
- **WHEN** the client has completed solo sessions (LiveSession where coachId IS NULL and routine is assigned to them)
- **THEN** those sessions appear in the response

#### Scenario: Co-op sessions are included
- **WHEN** the client appears as a LiveParticipant in a COMPLETED LiveSession
- **THEN** that session also appears in the response

#### Scenario: PENDING or ACTIVE sessions are excluded
- **WHEN** the client has ongoing sessions not yet COMPLETED
- **THEN** those sessions do NOT appear in the history list

#### Scenario: Unauthenticated request is rejected
- **WHEN** no JWT is provided
- **THEN** the system returns HTTP 401

#### Scenario: Coach role cannot access client session history
- **WHEN** a COACH-role JWT is used
- **THEN** the system returns HTTP 403

#### Scenario: Testability — manual QA
- **WHEN** a test client completes a solo workout via the UI and then calls `GET /progress/client/sessions`
- **THEN** the completed session appears at the top of the returned list with `completedAt` set

---

### Requirement: Client can view aggregated workout statistics
The system SHALL provide an endpoint `GET /progress/client/stats` that returns aggregated totals for the authenticated client: total completed sessions, total completed sets, and total completed exercises.

#### Scenario: Client with completed sessions gets real stats
- **WHEN** a client sends `GET /progress/client/stats` and has 5 completed sessions
- **THEN** the system returns HTTP 200 with `{ totalSessions: 5, totalSets: <sum>, totalExercises: <sum> }`

#### Scenario: Client with no completed sessions gets zeros
- **WHEN** the client has no COMPLETED sessions
- **THEN** the system returns HTTP 200 with `{ totalSessions: 0, totalSets: 0, totalExercises: 0 }`

#### Scenario: Null completion fields are counted as zero
- **WHEN** some sessions predate the schema change and have null `completedSets` / `completedExercises`
- **THEN** those nulls are treated as 0 in the aggregation (not surfaced as null in the response)

#### Scenario: Unauthenticated request is rejected
- **WHEN** no JWT is provided
- **THEN** the system returns HTTP 401

#### Scenario: Coach role cannot access client stats
- **WHEN** a COACH-role JWT is used
- **THEN** the system returns HTTP 403

#### Scenario: Testability — Jest unit
- **WHEN** `ProgressService.getClientStats(clientId)` is called with a mocked Prisma that returns sessions with mixed null/non-null `completedSets`
- **THEN** the method returns `{ totalSessions, totalSets, totalExercises }` with nulls treated as 0

---

### Requirement: Session completion persists summary metrics
The system SHALL persist `completionPercentage`, `completedSets`, and `completedExercises` on `LiveSession` when a session transitions to COMPLETED status, so history endpoints can return accurate data.

#### Scenario: Completion payload is saved on session complete
- **WHEN** `updateSessionStatus` is called with `status = COMPLETED` and a body containing `{ completionPercentage: 85, completedSets: 12, completedExercises: 4 }`
- **THEN** the `LiveSession` row is updated with those values alongside `status = COMPLETED` and `completedAt = now()`

#### Scenario: Missing completion fields default to null
- **WHEN** `updateSessionStatus` is called with `status = COMPLETED` and no completion stats in the body
- **THEN** the fields remain null and the session is still marked COMPLETED

#### Scenario: Testability — Jest unit
- **WHEN** `SessionService.updateSessionStatus` is invoked with completion stats and a mocked Prisma
- **THEN** the mocked `liveSession.update` is called with `completionPercentage`, `completedSets`, and `completedExercises` in the `data` payload
