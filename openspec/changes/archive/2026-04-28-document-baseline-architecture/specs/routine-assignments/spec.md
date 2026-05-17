## ADDED Requirements

### Requirement: Coach assigns a routine to a client

Assignments are managed as part of the routine create/edit flow. There is no standalone `/api/routines/:id/assignments` endpoint. When a Coach passes `clientIds` in `POST /api/routines/create` or `PUT /api/routines/:id/edit`, the service calls `assignClients` which:

1. Upserts a `RoutineAssignment` row for each `(routineId, clientId)` pair (no-op on duplicate).
2. Updates each client's `User.coachId` to the coach's id (side-effect: implicitly links client to coach).
3. Upserts a `ClientProfile` row for each client if one does not exist.

**Known gap:** No authorization check verifies that the targeted client is already linked to the calling coach. A coach can assign a routine to any CLIENT, which also overwrites that client's `coachId`. A follow-up change should add ownership validation.

**Known gap:** No socket event is emitted when a routine is assigned. The client is not notified in real time. The `notification:new` / `routine-assigned` event described in the original stub does not exist.

#### Scenario: Successful assignment via routine create

- **GIVEN** Coach C with CLIENT K
- **WHEN** C POSTs `/api/routines/create` with `{ name: "Push Day", clientIds: [K.id] }`
- **THEN** a `RoutineAssignment` row `(routineId, K.id)` is created
- **AND** `K.coachId` is set to `C.id` if not already set
- **AND** a `ClientProfile` row is upserted for K
- **AND** the response is `201 Created` with the routine including the assignment list

#### Scenario: Duplicate assignment is silently ignored

- **WHEN** C edits the routine passing `clientIds: [K.id]` again
- **THEN** the existing `RoutineAssignment` row is left unchanged (Prisma `upsert` no-op)
- **AND** no error is returned

#### Scenario: Remove all assignments via edit

- **WHEN** C PUTs `/api/routines/:id/edit` with `clientIds: []`
- **THEN** all `RoutineAssignment` rows for that routine are deleted
- **AND** the response is `200 OK`

### Requirement: Client lists assigned routines

A Client SHALL be able to list the routines assigned to them via `GET /api/routines/my-routines`.

#### Scenario: Client view of assigned routines

- **WHEN** Client K GETs `/api/routines/my-routines`
- **THEN** the response contains all `Routine` records where a `RoutineAssignment.clientId = K.id` exists
- **AND** each routine includes its ordered `exercises` array (`RoutineExercise` rows joined to `ExerciseCatalog`) and the `assignments` array

#### Scenario: Client without a coach

- **WHEN** a CLIENT with `coachId = null` calls the same endpoint
- **THEN** the response is `200 OK` with an empty array (no assignments)

### Requirement: Assigned-routines UI is internationalised

The client dashboard, the coach's assignments view, and any related dialogs SHALL render every label and empty state from `ca.json`, `es.json`, and `en.json`.

#### Scenario: Empty assignments

- **WHEN** a Client with zero assigned routines visits the dashboard in `ca`
- **THEN** the empty state text matches the Catalan string in `ca.json`

### Requirement: Routine assignments are testable

The assignment lifecycle SHALL be exercisable via manual QA today, and any future automated coverage SHALL live as Jest specs under `src/back/src/routines/`.

#### Scenario: Manual QA + future automated coverage

- **WHEN** a developer follows "Coach assigns routine to client → client sees it in dashboard" in `doc/Proves_usuari.md`
- **THEN** the assigned routine appears for the client without page reload (or at most after a refresh, depending on the realtime contract)
- **AND** a future Jest spec under `src/back/src/routines/` SHOULD cover successful assign, duplicate-assign, foreign-client guard, and client-side listing
