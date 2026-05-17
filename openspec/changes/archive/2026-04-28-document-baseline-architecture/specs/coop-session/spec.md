## ADDED Requirements

### Requirement: Coach (or solo Client) creates a session

Any authenticated user can call `POST /api/session/create` with `{ routineId }` to create a `LiveSession`. COACH sessions get `coachId` set; CLIENT solo sessions get `coachId = null`.

#### Scenario: Coach creates a co-op session

- **GIVEN** Coach C with routine `R`
- **WHEN** C POSTs `/api/session/create` with `{ routineId: R.id }` (JwtAuthGuard)
- **THEN** the system creates a `LiveSession` with `coachId = C.id`, `routineId = R.id`, a unique alphanumeric `sessionCode`, `status = PENDING` (default)
- **AND** the response is `200 OK` with the session object including the full `routine` (with exercises) and the `sessionCode`

**Known gap:** The spec previously assumed `POST /api/session` with `201 Created`. The actual endpoint is `POST /api/session/create` and returns `200 OK`. A follow-up should normalise to `201`.

#### Scenario: CLIENT creates a solo session

- **WHEN** a CLIENT with no coach POSTs `/api/session/create` with `{ routineId }` for a solo routine assigned to them
- **THEN** a `LiveSession` is created with `coachId = null` and the session code is returned

#### Scenario: CLIENT with coach tries to create a session for a coach-owned routine

- **WHEN** the routine has `coachId != null`
- **THEN** the service throws `403 Forbidden` (`"Esta rutina no pertenece al modo solitario"`)

**Known gap:** No `CoachGuard` on session creation — any role can call the endpoint as long as they satisfy the business-logic checks inside the service.

#### Scenario: Coach references a routine they do not own

- **WHEN** C POSTs with `routineId` of a routine where `coachId != C.id`
- **THEN** no ownership check is performed by the service — the session is created regardless.

**Known gap:** No ownership validation for COACHes. Any coach can create a session with any routine.

### Requirement: Client joins a co-op room via Socket.IO

The co-op room is managed entirely in-memory by `RoomGateway` (namespace `/room`). There is no `LiveParticipant` database table.

#### Scenario: Successful join

- **GIVEN** a `LiveSession` with code `XYZ`
- **WHEN** a client connects to the `/room` namespace and emits `joinRoom` with `{ roomId: "XYZ", userId: "123", username: "alice", isHost: false }`
- **THEN** the gateway adds the user to its in-memory `roomUsers` map for room `XYZ`
- **AND** the client's socket joins the Socket.IO room `XYZ`
- **AND** the client receives `joinedRoom` with `{ isHost, usersInRoom }`
- **AND** the room receives `roomUsersUpdate` with the updated `{ usersInRoom }` array
- **AND** if the joining user is not the host and there is cached progress, they also receive `opponentProgressUpdate` immediately

**Known gap:** No database persistence of participants. If the server restarts, all room state is lost.

#### Scenario: Wrong code / room does not exist

- **WHEN** a client emits `joinRoom` with a `roomId` that has no existing entry in `roomUsers`
- **THEN** the gateway creates a new empty room entry for that id (no validation against `LiveSession` table)

**Known gap:** The gateway does not validate that `roomId` corresponds to an existing `LiveSession`. Any string can be used as a room id.

### Requirement: Real-time exercise progress fan-out

While a session is active, each participant's `updateProgress` emission is cached (per-room) and broadcast to all other members.

#### Scenario: Participant reports progress

- **GIVEN** two clients in room `XYZ` (host H and guest G)
- **WHEN** H emits `updateProgress` with `{ roomId: "XYZ", userId, progressPercentage, completedExercises, currentExerciseIndex, currentSet, exerciseName, totalSets }`
- **THEN** the gateway caches the progress in `roomLastProgress` for room `XYZ`
- **AND** emits `opponentProgressUpdate` with the same payload to all OTHER sockets in the room (not back to the sender)

**Known gap:** No `WorkoutEvent` DB persistence. Progress is in-memory only. The spec previously assumed `room:exercise-progress` event name and DB persistence — neither is the case.

#### Scenario: Older `exerciseCompleted` event

- **WHEN** a client emits `exerciseCompleted` with `{ roomId, userId, exerciseId, progress }`
- **THEN** the gateway emits `opponentProgressUpdate` to the rest of the room (legacy fan-out, no caching)

### Requirement: Session lifecycle transitions

The Coach can start and complete a session via `POST /api/session/:code/status` with `{ status: "ACTIVE" | "COMPLETED" }`.

#### Scenario: Coach starts the session

- **WHEN** Coach C POSTs `/api/session/:code/status` with `{ status: "ACTIVE" }` (JwtAuthGuard)
- **THEN** the `LiveSession.status` is updated to `ACTIVE`

#### Scenario: Coach starts the room (Socket.IO)

- **WHEN** the host emits `startSession` with `{ roomId, routine }`
- **THEN** the gateway broadcasts `sessionStarting` with `{ routine }` to the whole room
- **AND** the frontend countdown begins for all participants

#### Scenario: Coach completes the session

- **WHEN** Coach C POSTs `/api/session/:code/status` with `{ status: "COMPLETED" }`
- **THEN** the `LiveSession.status` is updated to `COMPLETED`
- **AND** the room is NOT automatically cleared by the REST call (clearing happens via socket disconnect/leave)

#### Scenario: Non-owner tries to change status

- **WHEN** a CLIENT or a different coach tries to change status
- **THEN** the service throws `403 Forbidden`

### Requirement: Participant leaves the session

#### Scenario: Voluntary leave

- **WHEN** a client emits `leaveRoom` with `{ roomId, userId }`
- **THEN** the user is removed from the in-memory room
- **AND** if the leaver was the host: `hostDisconnected` is broadcast to the room, the invitation row is set to `REVOKED`, and the room's progress cache is cleared
- **AND** if the leaver was a guest: `guestDisconnected` is broadcast to the room

#### Scenario: Socket disconnect

- **WHEN** a socket disconnects unexpectedly
- **THEN** same logic as voluntary leave fires in `handleDisconnect`

### Requirement: Co-op UI is internationalised

The lobby, active session, and completion screens SHALL render every label, button, and state hint from `ca.json`, `es.json`, and `en.json`.

#### Scenario: Lobby and active states

- **WHEN** the language is switched to English during the lobby
- **THEN** "Esperant participants", "Començar sessió", and the active-state labels render their English equivalents from `en.json`

### Requirement: Co-op session is testable

The co-op session flow SHALL be exercisable via manual two-browser QA today, and any future automated coverage SHALL live as Jest specs under `src/back/src/room/` using a Socket.IO test client.

#### Scenario: Manual QA + future automated coverage

- **WHEN** a developer runs the "Coach + Client co-op session" steps in `doc/Proves_usuari.md` with two browser windows
- **THEN** join, progress fan-out, and completion all succeed in real time
- **AND** a future Jest spec under `src/back/src/room/` SHOULD use a Socket.IO test client to assert `room:join` → `room:participant-joined` broadcast and progress fan-out
