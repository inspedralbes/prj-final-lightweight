## Why

The co-op session flow (FriendSession / VirtualGymRoom) is the real-time differentiator of LightWeight and one of its most complex user journeys, yet it has zero automated coverage. LW-443 closes this gap by adding E2E tests that validate the full multi-user lifecycle — session creation, socket join, live state sync, and session completion with statistics — using the Playwright infrastructure already delivered by the testing epic (LW-436).

## What Changes

- New Playwright test file `e2e/tests/coop-session.spec.ts` covering the FriendSession / VirtualGymRoom multi-user flow using two parallel browser contexts.
- New seed data additions (if needed): a `LiveSession` fixture for resetting mid-test state, or reuse of existing `e2e_coach` / `e2e_client_linked` fixtures.
- Extension of the `e2e/fixtures/` barrel with a `coopSession` fixture helper that creates and tears down a `LiveSession` record via the backend testing module.
- Possible minor additions to `POST /api/testing/reset` if `LiveSession` / `LiveParticipant` cleanup is not already covered.

## Capabilities

### New Capabilities

- `e2e-coop-session`: E2E test suite for the multi-user training session flow (FriendSession / VirtualGymRoom). Covers: coach creates session, client joins via `sessionCode`, Socket.IO `room:join` event verified on both contexts, live exercise-progress sync, session completion, and post-session statistics persistence.

### Modified Capabilities

- `e2e-testing`: Minor extension — ensure `POST /api/testing/reset` cleans `LiveSession`, `LiveParticipant`, `WorkoutEvent`, and `ChatMessage` rows scoped to `e2e_*` users (these may already be covered by existing cascade rules; to be confirmed during implementation).

## Impact

**Backend (`src/back/src/`)**
- `testing/` module: verify (and if needed extend) reset endpoint cleans `LiveSession`-related rows for `e2e_*` users.
- `session/` and `room/` modules: no logic changes; tests exercise existing `SessionController` and `RoomGateway` endpoints.

**Frontend (`src/front/src/features/workout/`)**
- No logic changes; tests navigate existing `CoopSessionLobby`, `WorkoutRoom`, and `SessionSummary` pages.

**E2E workspace (`e2e/`)**
- New test file: `e2e/tests/coop-session.spec.ts`
- New fixture helper: `e2e/fixtures/coopSession.ts` (or added to existing `fixtures/index.ts`)
- Playwright config: may require `workers: 1` for multi-context tests to avoid port conflicts on the Socket.IO singleton.

**Socket.IO events exercised (read-only)**
- `room:join`, `room:state`, `room:participant-joined`, `room:exercise-progress`, `room:complete`, `room:participant-left`

**Dependencies**
- Requires the Playwright E2E workspace (`e2e/`) and backend testing module from LW-436 to be merged and working.
- Requires seed data (`e2e_coach`, `e2e_client_linked`) from `src/back/prisma/seed.ts`.

**Testing note**
- Tests run two `BrowserContext` instances in the same Playwright worker to simulate the two-user scenario; no extra infrastructure needed beyond what LW-436 delivered.

**Jira**: LW-443 · Epic: LW-436 (Implementación de estrategia de testing — E2E + unitarios)
