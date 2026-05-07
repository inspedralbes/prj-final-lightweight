# Spec: E2E Coop Session

## Purpose

TBD — Provide end-to-end tests covering the full two-user cooperative session flow: fixture setup for multi-context tests, FriendSession code generation, two-user VirtualGymRoom join, real-time exercise progress sync, session completion, and host disconnection handling.

---

## Requirements

### Requirement: Multi-context fixture for two-user tests

The E2E workspace SHALL provide a `twoContexts` fixture at `e2e/fixtures/two-contexts.ts` that creates two independent `BrowserContext` instances — one authenticated as `e2e_coach` (COACH) and one authenticated as `e2e_client_linked` (CLIENT) — using the existing `loginViaApi` helper applied to each context's page. The fixture SHALL close both contexts after the test. The `e2e/fixtures/index.ts` barrel SHALL re-export the extended `test` object that includes `twoContexts`, `loginAs`, and `freshDb`.

#### Scenario: twoContexts yields independent authenticated sessions

- **GIVEN** the backend running with `E2E_TESTING=true` and seed applied
- **WHEN** a test uses the `twoContexts` fixture
- **THEN** `coachPage.evaluate(() => localStorage.getItem('userRole'))` returns `'COACH'`
- **AND** `clientPage.evaluate(() => localStorage.getItem('userRole'))` returns `'CLIENT'`
- **AND** `coachPage.evaluate(() => localStorage.getItem('username'))` returns `'e2e_coach'`
- **AND** `clientPage.evaluate(() => localStorage.getItem('username'))` returns `'e2e_client_linked'`
- **AND** the two pages belong to different browser contexts (separate localStorage origins)

#### Scenario: twoContexts contexts are closed after the test

- **GIVEN** a test that uses `twoContexts` and throws an error mid-test
- **WHEN** the test teardown runs
- **THEN** both browser contexts are closed (no Playwright resource leak)

---

### Requirement: Coach generates a FriendSession code via the UI

The E2E test SHALL verify that a COACH user can navigate to the FriendSession page, click "Generate code", and receive a non-empty session code displayed in the UI.

#### Scenario: Coach generates a session code

- **GIVEN** `e2e_coach` is authenticated and on the FriendSession page (`/friend-session`)
- **WHEN** the coach clicks the "Generate code" button
- **THEN** a non-empty code string is displayed in the page within 5 seconds
- **AND** the code can be read from the DOM via a `data-testid="generated-code"` element (or the visible text field showing the code)

#### Scenario: Coach sees copy button after code generation

- **GIVEN** a code has been generated and is displayed
- **WHEN** the coach views the page
- **THEN** a copy-to-clipboard button is visible next to the code

#### Scenario: Unauthenticated user cannot access FriendSession page

- **GIVEN** no token in localStorage
- **WHEN** the user navigates to `/friend-session`
- **THEN** they are redirected to `/login` (React Router ProtectedRoute guard fires)

---

### Requirement: Both users join VirtualGymRoom and see each other

The E2E test SHALL verify the full two-user join flow: coach creates a room using the seeded invitation code `E2E-INVITE-001` (via direct navigation, bypassing UI code generation to keep the test deterministic), client joins the same room, and both contexts receive the `roomUsersUpdate` event reflected as two entries in the users list.

#### Scenario: Coach joins room as host and sees themselves

- **GIVEN** `e2e_coach` is authenticated and navigates to `/workout/room/E2E-INVITE-001` with `state: { isHost: true }`
- **WHEN** the VirtualGymRoom mounts and Socket.IO connects to `/room`
- **THEN** the page shows a connected state (loader disappears, lobby is rendered) within 5 seconds
- **AND** the coach's username (`e2e_coach`) appears in the users list

#### Scenario: Client joins room and both users see each other

- **GIVEN** `e2e_coach` is already in the room as host (from the previous step)
- **WHEN** `e2e_client_linked` navigates to `/workout/room/E2E-INVITE-001` (no `isHost` flag)
- **THEN** the client's context shows two users in the room within 5 seconds
- **AND** the coach's context also shows two users in the room (`roomUsersUpdate` received)

#### Scenario: Room reflects correct host/guest roles

- **GIVEN** both users have joined the room
- **WHEN** the lobby UI is inspected
- **THEN** `e2e_coach` sees the "Start session" button (host UI)
- **AND** `e2e_client_linked` does NOT see the "Start session" button (guest UI)

---

### Requirement: Session starts and exercise progress is synced

The E2E test SHALL verify that the coach can start the session, and that progress updates sent by one participant are received by the other via the `opponentProgressUpdate` Socket.IO event, reflected in the UI.

#### Scenario: Coach starts the session and both see countdown

- **GIVEN** both `e2e_coach` and `e2e_client_linked` are in the lobby
- **WHEN** `e2e_coach` clicks "Start session"
- **THEN** the `sessionStarting` event fires and both contexts transition out of the lobby state
- **AND** both pages render the active workout interface (countdown or exercise view) within 8 seconds

#### Scenario: Coach progress update appears in client's view

- **GIVEN** the session is active in both contexts
- **WHEN** `e2e_coach` advances to the next exercise (emits `updateProgress`)
- **THEN** `e2e_client_linked`'s page shows the coach's updated progress within 5 seconds (e.g., opponent progress bar or exercise name updates)

#### Scenario: Client progress update appears in coach's view

- **GIVEN** the session is active in both contexts
- **WHEN** `e2e_client_linked` advances an exercise (emits `updateProgress`)
- **THEN** `e2e_coach`'s page shows the client's updated progress within 5 seconds

---

### Requirement: Session completes and statistics are persisted

The E2E test SHALL verify that when both participants finish the session, the UI transitions to `SessionSummary` and the backend records the session as `COMPLETED`.

#### Scenario: Both users finish and see summary

- **GIVEN** both `e2e_coach` and `e2e_client_linked` have completed all exercises
- **WHEN** each emits `sessionFinished` (by completing the workout UI flow)
- **THEN** both pages navigate to the `SessionSummary` component or equivalent end state within 10 seconds
- **AND** neither page shows an error state

#### Scenario: Session status is COMPLETED in the backend after finishing

- **GIVEN** the session has been completed by both users
- **WHEN** the test calls `GET /api/session/E2E-INVITE-001` (or the dynamically created session code)
- **THEN** the API response has `status: 'COMPLETED'`

#### Scenario: Partner sees partner-finished notification when host finishes first

- **GIVEN** `e2e_coach` finishes before `e2e_client_linked`
- **WHEN** `e2e_coach` emits `sessionFinished`
- **THEN** `e2e_client_linked`'s page receives the `partnerFinished` event and shows a visual indicator that the partner has finished

---

### Requirement: Host disconnection is handled gracefully

The E2E test SHALL verify that if the coach (host) leaves the room, the client's UI reflects the host disconnection.

#### Scenario: Client sees host-disconnected state when coach leaves

- **GIVEN** both users are in an active session
- **WHEN** `e2e_coach`'s browser context is closed (simulating a disconnect)
- **THEN** `e2e_client_linked`'s page receives `hostDisconnected` and shows a disconnection message or redirects to lobby within 8 seconds
- **AND** the room is cleaned up server-side (no stale in-memory room entry)
