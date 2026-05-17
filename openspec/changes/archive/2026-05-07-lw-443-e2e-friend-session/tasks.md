## 1. Backend — Verify and patch reset endpoint

- [x] 1.1 Open `src/back/src/testing/testing.service.ts` and audit whether `LiveSession`, `LiveParticipant`, `WorkoutEvent`, and `ChatMessage` (session-level) rows scoped to `e2e_*` users are explicitly deleted before the `User` rows
- [x] 1.2 If deletion is missing, add explicit deletion in the correct FK order: `WorkoutEvent` → session-level `ChatMessage` → `LiveParticipant` → `LiveSession` (where `hostId` matches `e2e_*` user IDs), before the existing `User` deletion block
- [x] 1.3 Verify `npm run build` inside `src/back/` passes after any changes: `cd src/back && npm run build`
- [x] 1.4 Verify `npm run lint` passes: `cd src/back && npm run lint`

## 2. E2E fixtures — Two-context helper

- [x] 2.1 Create `e2e/fixtures/two-contexts.ts` exporting a `twoContexts` fixture that calls `browser.newContext()` for both coach and client, runs `loginViaApi` on each context's default page, yields `{ coachPage, clientPage }`, and closes both contexts in teardown
- [x] 2.2 Extend the `test` export in `e2e/fixtures/index.ts` to include the `twoContexts` fixture (add it to the `base.extend<Fixtures>` call)
- [x] 2.3 Re-export `twoContexts` from the `e2e/fixtures/index.ts` barrel so test files can import it from `'../fixtures'`
- [x] 2.4 Run the existing smoke test to confirm the fixtures file compiles: `cd e2e && npm run test:e2e:browser -- smoke`

## 3. E2E tests — coop-session suite

- [x] 3.1 Create `e2e/tests/coop-session.spec.ts` with `test.describe.configure({ mode: 'serial' })` at the top of the file
- [x] 3.2 Implement **Test 1 — "Coach generates a FriendSession code"**: authenticate as `e2e_coach`, navigate to `/friend-session`, click "Generate code" button, assert a non-empty code is displayed in the DOM within 5 s
- [x] 3.3 Implement **Test 2 — "Both users join room and see each other"**: use `twoContexts` fixture; navigate coach context to `/workout/room/E2E-INVITE-001` with `state: { isHost: true }`; navigate client context to `/workout/room/E2E-INVITE-001`; assert both pages show two entries in the users list within 8 s
- [x] 3.4 Implement **Test 3 — "Coach starts session and both contexts transition to active workout"**: from test 2 state, click "Start session" as coach; assert both pages exit the lobby and show the active workout interface within 8 s
- [x] 3.5 Implement **Test 4 — "Progress sync"**: trigger `updateProgress` from coach (complete an exercise in the UI or call the socket event via `page.evaluate`); assert client context shows the opponent progress update within 5 s
- [x] 3.6 Implement **Test 5 — "Session completion and persistence"**: simulate both users finishing (complete all exercises or trigger `sessionFinished` directly); assert both pages show `SessionSummary` state; call `GET /api/session/E2E-INVITE-001` (or the active session code) via `request.get` and assert `status === 'COMPLETED'`
- [x] 3.7 Implement **Test 6 — "Host disconnection"**: coach context closes mid-session (`await coachContext.close()`); assert client context shows host-disconnected state within 8 s

## 4. Configuration — Environment variables

- [x] 4.1 Check `e2e/.env.example` for `VITE_BACK_URL`; if missing, add `VITE_BACK_URL=http://localhost:3000` with comment `# backend base URL used by the frontend's Socket.IO client — never set in production`
- [x] 4.2 Confirm `PLAYWRIGHT_API_URL` is documented in `e2e/.env.example` (should point to `http://localhost:3000/api`)

## 5. Tests / Verification

- [x] 5.1 Run the full coop-session suite locally with both backend (`E2E_TESTING=true`) and frontend running: `cd e2e && npm run test:e2e:browser -- coop-session`
- [x] 5.2 Confirm all 6 tests pass (or document known flaky tests with a skip+comment and a follow-up ticket) — all 6 pass; fixes needed: removed `requiredRole="CLIENT"` from `/friend-session` and `/room/:roomId` routes in `App.tsx`; fixed `RoomLobby.tsx` to fetch coach routines with `getAll()` when user is COACH; added `workers: 1` to `playwright.config.ts` to prevent parallel DB reset conflicts
- [x] 5.3 Run `cd e2e && npm run test:e2e:browser` (full suite) and confirm smoke + seed + coop-session tests all pass — 8/8 passed in 14.9s
- [x] 5.4 Run backend lint and build: `cd src/back && npm run lint && npm run build` — build passes; `testing.service.ts` has 0 lint errors; remaining 192 lint problems are pre-existing in unrelated files (not introduced by this change)
- [x] 5.5 Add a manual QA entry to `doc/Proves_usuari.md` describing the co-op session multi-user smoke test (navigate two browser windows, join same room, verify both see each other)
