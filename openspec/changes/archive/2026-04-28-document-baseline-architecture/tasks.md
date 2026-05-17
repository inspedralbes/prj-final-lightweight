# Tasks — document-baseline-architecture

> This change is documentation-only. No code under `src/back/` or `src/front/` is modified.
> Each task either _authors a spec_, _verifies a fact against the live code_, or _runs a CLI check_.
> Mark tasks "Done" as you progress. Aim for chunks of ≤ 2 hours.

## 0. Prerequisites (already done in this proposal)

- [x] 0.1 Adapt `openspec/config.yaml` to the LightWeight project (modules, features, Socket.IO matrix, Catalan-first i18n).
- [x] 0.2 Scaffold change directory `openspec/changes/document-baseline-architecture/` via `openspec new change`.
- [x] 0.3 Author `proposal.md` (why + capabilities + impact).
- [x] 0.4 Author `design.md` (baseline diagrams, decisions D1–D8, event matrix, REST summary, risks, open questions).
- [x] 0.5 Author 14 capability spec stubs at `specs/<capability>/spec.md`.

## 1. Verify spec content against live code (per capability)

For each spec, read the listed source files and reconcile every divergence. If a scenario contradicts the code, **rewrite the scenario** (the code is the source of truth for this baseline change). If a scenario describes correct behaviour but the code disagrees, do NOT change the code — open a follow-up issue and note it under "Known gaps" inside the spec.

### 1.1 auth — `specs/auth/spec.md`

- [x] 1.1.1 Read `src/back/src/auth/auth.controller.ts`, `auth.service.ts`, `dto/`, `guards/`, `strategies/`. Confirm endpoint paths, status codes, and DTO validation rules.
- [x] 1.1.2 Read `src/front/src/features/auth/{pages,components,context}/`. Confirm `ProtectedRoute` redirect target, the `Login`/`Register`/`ForgotPassword` flow, and `AuthContext` state shape.
- [x] 1.1.3 ~~Resolve **Open Question Q2**~~: **resolved** — forgot-password is a UI stub (no email recovery yet). Spec already reflects the stub and flags real email delivery as a follow-up. Confirm during 1.1.1 read-through that the controller behaviour matches the stub description.
- [x] 1.1.4 Confirm i18n keys for the auth pages exist in all three locales; list any missing keys in a "Known gaps" line.
- [x] 1.1.5 Run the auth manual-QA steps in `doc/Proves_usuari.md`; mark this task done only when register → login → me → logout work.

### 1.2 invitations — `specs/invitations/spec.md`

- [x] 1.2.1 Read `src/back/src/invitations/{controller,service,dto}/`. Confirm endpoints, exact HTTP codes for expired/revoked/duplicate-coach cases, and the notification emission point.
- [x] 1.2.2 Read the frontend invitation flow (sidebar badge in `Layout.tsx`, inbox UI, accept-by-code modal). Confirm whether direct invites land in an inbox UI or only via toast.
- [x] 1.2.3 Verify `Invitation.expiresAt` policy (TTL in days?). Update the spec scenarios with the actual TTL.
- [x] 1.2.4 Run the "Coach invites Client (code + direct)" manual QA in `doc/Proves_usuari.md`.

### 1.3 routines — `specs/routines/spec.md`

- [x] 1.3.1 Read `src/back/src/routines/{controller,service,dto}/`. Confirm exact REST shape for routine CRUD and routine-exercise sub-routes.
- [x] 1.3.2 Read `src/front/src/features/routines/`. Confirm the modal flow, the exercises edit page, and the public/private toggle UI.
- [x] 1.3.3 Verify cascade behaviour by running `npx prisma validate` and inspecting the migration files for `onDelete: Cascade` on `RoutineExercise` and `RoutineAssignment`.
- [x] 1.3.4 Manual QA: create routine, add exercises, reorder, delete.

### 1.4 routine-assignments — `specs/routine-assignments/spec.md`

- [x] 1.4.1 Read the controller path for assignments (it lives inside `routines.controller.ts` — confirm the exact route shape and update the spec).
- [x] 1.4.2 Confirm whether assigning emits `notification:new` to the client; if not, downgrade that bullet from MUST to MAY in the spec.
- [x] 1.4.3 Manual QA: coach assigns routine, client sees it on dashboard.

### 1.5 exercises-catalog — `specs/exercises-catalog/spec.md`

- [x] 1.5.1 Read `src/back/src/exercises/{controller,service}/`. Confirm whether the GET endpoint is JWT-guarded.
- [x] 1.5.2 Confirm filter query parameter names (`primaryMuscle`, `level`, `equipment`, `q` etc.) and update the scenarios to match.
- [x] 1.5.3 Read `src/front/src/features/exercises/components/ExerciseSearchModal.tsx`. Confirm the rendered filter UI.
- [x] 1.5.4 Manual QA: open search modal, filter by muscle, add to routine.

### 1.6 solo-workout — `specs/solo-workout/spec.md`

- [x] 1.6.1 Read `src/front/src/features/workout/pages/SoloWorkoutSession.tsx` and the `ActiveSession`/`SessionSummary` components. Confirm set-tracking, rest-timer, and end-of-session behaviour.
- [x] 1.6.2 Confirm the route is gated to CLIENT (or accessible by COACH for testing). Update the role guard scenario accordingly.
- [x] 1.6.3 Manual QA: run a full solo workout end-to-end.

### 1.7 coop-session — `specs/coop-session/spec.md`

- [x] 1.7.1 Read `src/back/src/session/{controller,service}/` and `src/back/src/room/room.gateway.ts`. Confirm the exact REST endpoints (`POST /api/session`, `POST /api/session/:code/start`, `POST /api/session/:code/complete`, `GET /api/session/:code` — or whatever the controller actually exposes).
- [x] 1.7.2 Confirm the **Socket.IO event names** for room operations (`room:join`, `room:leave`, `room:exercise-progress`, `room:complete`, `room:state`, `room:participant-joined`, `room:participant-left`). If any name differs, update both the spec AND the event matrix in `design.md`.
- [x] 1.7.3 Confirm whether the gateway persists progress events as `WorkoutEvent` rows, and whether the eventType string matches what the spec says.
- [x] 1.7.4 Manual QA: two browsers, one Coach + one Client, run a co-op session through start → progress → complete.

### 1.8 p2p-chat — `specs/p2p-chat/spec.md`

- [x] 1.8.1 Read `src/back/src/chat/{controller,service}.ts` and `src/back/src/events/events.gateway.ts`. Confirm the exact Socket.IO event names (`chat:send`, `chat:read`, `chat:message`, `chat:read-receipt`).
- [x] 1.8.2 Confirm the JWT validation strategy on the socket handshake (where in `EventsGateway` does it run; what error is returned).
- [x] 1.8.3 Read `src/front/src/features/chat/components/P2PChat.tsx` and `services/chatService.ts`. Confirm the unread-badge logic and the read-receipt trigger.
- [x] 1.8.4 Manual QA: two browsers, send messages both directions, close and reopen the chat to test history + unread + read receipts.

### 1.9 video-call — `specs/video-call/spec.md`

- [x] 1.9.1 Read `EventsGateway` for `video-call-invite`, `video-call-delivered`, `video-call-unavailable`, `video-call-accept`, `video-call-reject`, `video-call-cancel`, `join-room`, `webrtc-offer`, `webrtc-answer`, `webrtc-ice-candidate`. Confirm all names letter-for-letter.
- [x] 1.9.2 Read `P2PChat.tsx` (caller) and `App.tsx` / `AppContent` (callee popup) and `VideoCallModal.tsx`. Confirm the 30-second timeout, the cancel flow, the mute toggle, and the hang-up event name (peer-side cleanup).
- [x] 1.9.3 Read `src/front/src/shared/hooks/useRingtone.ts`. Confirm the AudioContext pre-unlock behaviour and update the iOS scenario if details differ.
- [x] 1.9.4 ~~Resolve **Open Question Q3**~~: **resolved** — STUN is hardcoded to `stun:stun.l.google.com:19302` with no TURN. Spec captures the hardcoded value and flags env-driven STUN/TURN as a follow-up. Confirm during 1.9.2 that no env variable shadows the hardcoded value.
- [x] 1.9.5 Manual QA: video call between two browsers (one mobile if possible). Verify mute, hangup, callee-offline, 30 s timeout, and permission-denied flows.

### 1.10 notifications — `specs/notifications/spec.md`

- [x] 1.10.1 Read `src/front/src/features/notifications/{components,context}/`. Confirm the exact toast/badge UX and the events the context subscribes to.
- [x] 1.10.2 Confirm whether `notification:new` is the actual event name on the server side (cross-check with `EventsGateway`). Update if different.
- [x] 1.10.3 Manual QA: trigger each notification path (invitation accepted, chat message while elsewhere, incoming call) and verify the toast + badge.

### 1.11 client-profile — `specs/client-profile/spec.md`

- [x] 1.11.1 Read `src/back/src/clients/{controller,service,dto}/`. Confirm endpoints and the visibility rules around `personalDataShared`.
- [x] 1.11.2 Read the coach-side frontend pages that render `ClientProfile` and the client-side dashboard if it consumes any profile fields.
- [x] 1.11.3 Manual QA: coach edits notes, client logs in and verifies notes are NOT visible.

### 1.12 i18n — `specs/i18n/spec.md`

- [x] 1.12.1 Read `src/front/src/i18n/config.ts`. Confirm whether browser language detection is enabled; update the spec scenario.
- [x] 1.12.2 Audit `ca.json`/`es.json`/`en.json` for key parity. Open a follow-up issue listing any divergences (do NOT fix them in this change unless trivial).
- [x] 1.12.3 Manual QA: switch language across all primary screens, verify every visible string changes.

### 1.13 theming — `specs/theming/spec.md`

- [x] 1.13.1 Read `src/front/src/shared/layout/ThemeSwitcher.tsx` and any related Tailwind configuration. Confirm whether the default is system-pref or hardcoded.
- [x] 1.13.2 Audit every page in dark mode (Login, Register, Dashboard, Routines, Chat, Workout, Notifications, Coach pages, Client pages). Note any contrast/colour bugs as follow-ups.
- [x] 1.13.3 Manual QA: toggle theme, reload, verify persistence and no flash.

### 1.14 infra-deploy — `specs/infra-deploy/spec.md`

- [x] 1.14.1 Read `nginx/default.conf`, `nginx/default-init.conf`, `init-ssl.sh`, `docker-compose.prod.yml`, `.github/workflows/deploy.yml`. Confirm the routing tables, the certbot profile, and the rsync target path.
- [x] 1.14.2 **Open a Jira US for the `events-debug` security follow-up** (Q1 resolution: omit and flag). Read `src/back/src/events/events-debug.controller.ts` only to populate the follow-up description; do NOT document the controller as production surface in `infra-deploy/spec.md` (already flagged as a known gap).
- [x] 1.14.3 Confirm the cron schedule in the host crontab template matches the spec (`0 3 * * 1`).
- [x] 1.14.4 Smoke check: `curl -I https://lightweight.daw.inspedralbes.cat` returns `HTTP/2 200`.

## 2. Spec library hygiene

- [x] 2.1 Run `openspec validate` (or the equivalent CLI command) and fix any structural errors reported across the 14 specs.
- [x] 2.2 Run `openspec status --change document-baseline-architecture --json`; confirm `isComplete: true`.
- [x] 2.3 Cross-check the `## ADDED Requirements` / `### Requirement: ` / `#### Scenario: ` indentation: every scenario MUST use exactly four hashtags (per the OpenSpec instruction).
- [x] 2.4 Confirm every spec has at least one **Testability** requirement with a manual-QA pointer (or a future-Jest pointer).
- [x] 2.5 Cross-link consistency: every Socket.IO event mentioned in a spec MUST also appear in the event matrix in `design.md`. Reconcile both directions.

## 3. Resolved decisions (formerly open questions)

All five questions were resolved up-front; these tasks track the _follow-ups_ they imply rather than the original investigation.

- [x] 3.1 **Q1 → omit + flag.** `events-debug` is excluded from `infra-deploy` and recorded as a security gap. Follow-up: open a Jira US (covered by task 1.14.2).
- [x] 3.2 **Q2 → stub.** Forgot-password is a UI stub today; `auth` spec describes the stub and flags real email recovery as a future change.
- [x] 3.3 **Q3 → hardcoded Google STUN, no TURN.** `video-call` spec documents the hardcoded value and flags env-driven STUN/TURN as a follow-up; `infra-deploy` references it.
- [x] 3.4 **Q4 → merged.** `coach-clients-listing` is part of `client-profile`; no separate spec exists.
- [x] 3.5 **Q5 → Jira (Epic → US → Tasks).** `openspec/config.yaml` `proposal` rules updated; every future proposal links its Jira US.

### Follow-up Jira US to open during /opsx:apply

- [x] 3.6 Open Jira US: "Audit and gate `events-debug.controller.ts`" (security).
- [x] 3.7 Open Jira US: "Replace forgot-password stub with real email recovery" (auth).
- [x] 3.8 Open Jira US: "Make WebRTC STUN/TURN env-driven and add self-hosted TURN" (video-call + infra-deploy).

## 4. Documentation cross-references (no source code changes)

- [x] 4.1 Add a brief "OpenSpec workflow" section to the root `README.md` (or `AGENTS.md`) pointing at `openspec/` and listing the four common slash-commands (`/opsx:propose`, `/opsx:apply`, `/opsx:verify`, `/opsx:archive`). This is the only edit OUTSIDE `openspec/` allowed by this change.
- [x] 4.2 Add a "deploy smoke check" section to `doc/Proves_usuari.md` if missing, listing the steps from spec `infra-deploy` requirement "Deploy is testable".
- [x] 4.3 Add a key-parity script (or note its absence as a follow-up) for `ca.json`/`es.json`/`en.json` — out of scope for this baseline if it requires npm dependencies.

## 5. Tests / Verification

> No automated tests are added or removed by this change. The list below is what to run before requesting review.

### CLI

- [x] 5.1 `openspec validate` — clean.
- [x] 5.2 `openspec status --change document-baseline-architecture` — `isComplete: true`.
- [x] 5.3 `npx prisma validate` (inside `src/back/` or via `docker exec lw-backend npx prisma validate`) — clean (sanity check, no schema is being changed).

### Manual QA

- [x] 5.4 Walk through every "Manual QA" scenario referenced by the 14 specs; confirm each pass and update `doc/Proves_usuari.md` with any new entries.
- [x] 5.5 Spot-check three random specs against the live code with a different reviewer.

### No-regression check

- [x] 5.6 `cd src/back && npm run lint && npm run build` — clean (sanity check that no source file was accidentally edited).
- [x] 5.7 `cd src/front && npm run lint && npm run build` — clean.

### Deploy impact

- [x] 5.8 None expected. After merging to `main`, the GitHub Actions workflow will redeploy automatically; verify the production smoke check (`curl -I` + sign-in) per spec `infra-deploy` requirement "Deploy is testable".

## 6. Definition of Done for this change

- [x] 6.1 All boxes in sections 1–5 ticked or explicitly deferred with a follow-up issue.
- [x] 6.2 PR opened with description listing the 14 capabilities specced and pointing at `openspec/changes/document-baseline-architecture/`.
- [x] 6.3 At least one teammate has spot-checked three random specs against the live code (per 5.5).
- [x] 6.4 Production smoke check after merge per 5.8.
- [x] 6.5 Run `/opsx:verify` (or `openspec-verify-change`) against this change and address any findings before archive.
- [x] 6.6 Run `/opsx:archive` to move the change into `openspec/changes/archive/` and sync deltas into `openspec/specs/` so the spec library becomes the live baseline.
