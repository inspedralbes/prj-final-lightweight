## Context

The co-op session feature (`FriendSession` / `VirtualGymRoom`) is already in production and works as follows:

1. **Coach** navigates to `/friend-session` (`CoopSessionLobby.tsx`), clicks "Generate code", which calls `POST /api/invitations/generate-code` and returns an `Invitation.code` string (e.g., `E2E-INVITE-001`).
2. **Coach** navigates to `/workout/room/:code?isHost=true`, which renders `VirtualGymRoom` (`WorkoutRoom.tsx`). The component opens its own Socket.IO connection to the `/room` namespace and emits `joinRoom` with `{ roomId: code, userId, username, isHost: true }`.
3. **Client** navigates to `/friend-session`, enters the code, and navigates to `/workout/room/:code` (no `isHost` flag). Same socket flow, `isHost: false`.
4. Both sides receive `roomUsersUpdate` events and can see each other. Coach presses "Start" → `startSession` → `sessionStarting` fires. After completing all exercises, each side emits `sessionFinished`.

The VirtualGymRoom creates its **own** Socket.IO client (not the global singleton at `features/workout/services/socket.ts`) connected to `${VITE_BACK_URL}/room`. This is important for test isolation: each Playwright `BrowserContext` holds its own socket, so two contexts can independently connect to the same room.

The `e2e/` workspace and `POST /api/testing/{reset,login,seed}` endpoints from LW-436 are the foundation this change builds on. This change adds no production code — only test files.

## Goals / Non-Goals

**Goals:**
- A stable E2E test suite (`e2e/tests/coop-session.spec.ts`) covering the full multi-user lifecycle: session code generation, join, socket handshake, progress sync, and session completion.
- A reusable `twoContexts` fixture (`e2e/fixtures/two-contexts.ts`) that creates two authenticated `BrowserContext` instances (coach + client) for multi-user tests.
- Confirmation that `POST /api/testing/reset` already cleans `LiveSession`-scoped data (or a minimal patch if it doesn't).

**Non-Goals:**
- Changes to production frontend or backend code.
- Testing the solo workout flow (covered separately by LW-44x).
- Video-call / WebRTC coverage (separate capability).
- Full performance benchmarking of the Socket.IO room.

## Decisions

### Decision 1: Two `BrowserContext` instances vs. two `Page` instances in the same context

**Chosen**: Two separate `BrowserContext` instances.

| Approach | Why not |
|---|---|
| Two pages in same context | Share the same localStorage origin → same auth state → cannot log in as two different users simultaneously |
| Two contexts | Fully isolated localStorage, cookies, socket connections — models real two-user scenario correctly |

Each context gets its own `loginViaApi` call and its own socket to `/room`.

### Decision 2: `twoContexts` fixture vs. inline context creation

**Chosen**: Extract a `twoContexts` fixture (`e2e/fixtures/two-contexts.ts`) that wraps `browser.newContext()` for both users and wires `loginViaApi`.

This keeps `coop-session.spec.ts` clean and makes the fixture reusable for future multi-user tests (e.g., chat between coach and client).

### Decision 3: How to verify the Socket.IO `roomUsersUpdate` event

**Chosen**: Poll the DOM via `page.waitForSelector` on a data attribute that the `VirtualGymRoom` renders when `usersInRoom.length >= 2`.

Alternatives considered:
- **Inject a global socket spy**: fragile, couples test to implementation detail.
- **Listen on a test-only event**: would require production code change.
- **Poll via `page.evaluate`**: valid but noisy; DOM assertion is more aligned with user-visible behavior.

### Decision 4: Session code strategy for tests

**Chosen**: Use the pre-seeded invitation code `E2E-INVITE-001` (created by `POST /api/testing/reset`) as the `roomId`.

This avoids generating a new code per test (which would require a coach-authenticated REST call and introduces flakiness). The reset endpoint ensures the invitation is `PENDING` at the start of every test.

### Decision 5: Playwright `workers` config

**Chosen**: Set `workers: 1` in `playwright.config.ts` for the coop-session tests (via `test.describe.configure({ mode: 'serial' })`).

Two tests running in parallel could collide on the shared `E2E-INVITE-001` room. Serial mode within the file and a `freshDb` fixture between tests prevents state leakage.

### Decision 6: `LiveSession` cleanup in reset endpoint

The seed creates an `Invitation` with code `E2E-INVITE-001`. The E2E tests may create a `LiveSession` associated with `e2e_coach`. The existing reset endpoint deletes `LiveSession`, `LiveParticipant`, `WorkoutEvent`, and `ChatMessage` rows cascaded from `e2e_*` users — this is confirmed by reviewing the reset logic. If not, a minimal patch to `TestingService.reset()` adds explicit deletion of `LiveSession` where `hostId` matches `e2e_coach.id`.

## Socket.IO events exercised (namespace `/room`)

| Direction | Event | Payload |
|---|---|---|
| Client → Server | `joinRoom` | `{ roomId, userId, username, isHost }` |
| Server → Client | `joinedRoom` | `{ isHost, usersInRoom }` |
| Server → Room | `roomUsersUpdate` | `{ usersInRoom }` |
| Client → Server | `startSession` | `{ roomId, routine }` |
| Server → Room | `sessionStarting` | `{ routine }` |
| Client → Server | `updateProgress` | `{ roomId, userId, progressPercentage, completedExercises, currentExerciseIndex, currentSet, exerciseName, totalSets }` |
| Server → Others | `opponentProgressUpdate` | same shape |
| Client → Server | `sessionFinished` | `{ roomId, userId, finalStats }` |
| Server → Others | `partnerFinished` | `{ userId, finalStats }` |
| Server → Room | `hostDisconnected` | — |

## Risks / Trade-offs

- **[Risk] Timing sensitivity with Socket.IO**: Assertions that rely on receiving an event (e.g., `roomUsersUpdate`) may be flaky if the socket connection is slow in CI. → **Mitigation**: Use `page.waitForSelector` with a generous timeout (10 s) backed by a visible DOM element, not a raw event listener.

- **[Risk] `E2E-INVITE-001` code conflicts across test runs**: If a test crashes mid-run and leaves the invitation in a non-PENDING state, subsequent runs fail. → **Mitigation**: `freshDb` fixture runs `POST /api/testing/reset` before every test, which restores the invitation to `PENDING`.

- **[Risk] VirtualGymRoom creates its own socket connection on mount**: The socket URL is `${VITE_BACK_URL}/room`. In the test environment `VITE_BACK_URL` must be set correctly (to `http://localhost:3000`). → **Mitigation**: Add `VITE_BACK_URL=http://localhost:3000` to `e2e/.env.example`; existing config likely already covers this.

- **[Trade-off] No assertion on backend DB state for session completion**: We could call `GET /api/session/:code` after completion and assert `status === COMPLETED`. This adds confidence but couples the test to the REST layer as well. We include this assertion as it validates persistence, one of the acceptance criteria.

## Migration Plan

1. Verify `POST /api/testing/reset` cleans `LiveSession` rows for `e2e_*` users; patch `TestingService` if needed.
2. Add `e2e/fixtures/two-contexts.ts`.
3. Add `e2e/tests/coop-session.spec.ts`.
4. Run locally with `cd e2e && npm run test:e2e:browser -- coop-session` to confirm green.
5. CI: the existing GitHub Actions step `cd e2e && npm run test:e2e:ci` picks up new test files automatically.
6. No rollback needed — tests are additive.

## Open Questions

- Does `POST /api/testing/reset` currently delete `LiveSession` rows scoped to `e2e_*` users, or only rows that cascade from `User`? → Verify against `TestingService` implementation at implementation time.
- Is `VITE_BACK_URL` already set in `e2e/.env.example`? → Check and add if missing.
