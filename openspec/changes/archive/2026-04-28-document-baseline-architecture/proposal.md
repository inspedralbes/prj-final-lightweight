## Why

LightWeight is an MVP already in production but has no formal specification library: behaviour lives only in the code, the README, and `doc/Proves_usuari.md`. Without a baseline of `openspec/specs/`, every future change made through OpenSpec would have to invent the "before" state from scratch, and verification (`/opsx:verify`) has nothing to compare against. Establishing the baseline now turns the existing system into the source of truth that future deltas can extend.

## What Changes

- Document the **existing** functionality of the platform as OpenSpec capabilities (no behaviour changes — this is a documentation-only change).
- Create one `specs/<capability>/spec.md` per major capability listed below, each with GIVEN/WHEN/THEN scenarios derived from the live code, the README, the Prisma schema, and the manual-QA list (`doc/Proves_usuari.md`).
- Capture the cross-cutting Socket.IO protocol (chat, co-op session room, WebRTC signalling) as part of the realtime-related specs so the event surface is explicit.
- Adapt `openspec/config.yaml` (already done in this change) so its rules reference LightWeight modules/features, the Jest test harness, and the Catalan-first i18n convention — replacing the inherited Sala-Onirica template.
- Produce a `design.md` that records the architectural baseline: high-level diagram, module map, Socket.IO event matrix, Prisma ER, deploy topology — so future changes have a single place to point at when they touch shared concerns.
- Produce a `tasks.md` whose work is **writing the spec files** themselves (not implementing features) plus the verification steps to run `openspec validate`/`openspec status` once the library is seeded.

## Capabilities

### New Capabilities

- `auth`: registration, login (JWT), `me`/profile, logout, role guards (COACH vs CLIENT), and the password-reset flow exposed by the auth pages.
- `invitations`: coach↔client linking via shared invitation code or direct invite by username, including accept/reject, revoke, and the `Invitation` lifecycle (`PENDING`/`ACCEPTED`/`EXPIRED`/`REVOKED`).
- `routines`: coach CRUD over `Routine` and its ordered `RoutineExercise` items, including the public/private flag.
- `routine-assignments`: coach assigning a routine to one of their clients and the client viewing their assigned routines.
- `exercises-catalog`: read-only `ExerciseCatalog` with search and filtering by muscle / level / equipment used by `ExerciseSearchModal`.
- `solo-workout`: client running an assigned routine alone with per-set tracking and an end-of-session summary.
- `coop-session`: coach creating a `LiveSession` with a `sessionCode`, client joining via the code, both seeing real-time state via `RoomGateway` (room `session:{sessionCode}`).
- `p2p-chat`: realtime 1:1 chat between coach and client over Socket.IO, persisted in `P2PChatMessage`, with unread badge and read receipts.
- `video-call`: WebRTC P2P video call initiated from `P2PChat`, with Socket.IO signalling (`video-call-invite`, `video-call-delivered`/`unavailable`, `video-call-accept`/`reject`/`cancel`, `webrtc-offer`/`answer`/`ice-candidate`), 30 s timeout, and the iOS-compatible ringtone via Web Audio API.
- `notifications`: global `NotificationContext` driving the badge in the sidebar plus toasts for incoming invitations, messages, and calls.
- `client-profile`: coach-private goals and notes per client, surfaced from `ClientProfile`.
- `i18n`: full UI translated to Català (default), Castellà and Anglès via i18next, with persisted language preference.
- `theming`: dark / light mode toggle persisted client-side and respected by the Tailwind theme.
- `infra-deploy`: production topology (Docker Compose, Nginx reverse proxy, Let's Encrypt via Certbot, GitHub Actions deploy on push to `main`) — the operational contract that any future spec touching deploy must respect.

### Modified Capabilities

- _None._ This change introduces the spec library; there are no existing specs to modify.

## Non-goals

- **No code or behaviour changes.** This change does not touch `src/back/` or `src/front/` (other than documenting them). Behavioural fixes belong to dedicated future changes.
- **No new features.** Diet planning (`DietPlan`/`DietMeal`/`FoodCatalog`) exists in the Prisma schema as post-MVP scaffolding — it will not be specced here because it is not implemented end-to-end. A future change can introduce a `diet-planning` capability when the feature ships.
- **No introduction of a `shared/` workspace package.** The current monorepo duplicates types between front and back; that refactor is a separate change.
- **No new test harness.** The Vitest/Testing-Library frontend harness is recommended in `config.yaml` but its actual introduction is out of scope; `tasks.md` will note it as a follow-up.
- **No retroactive migrations.** The Prisma schema is documented as-is; we do not propose schema cleanups here.

## Impact

- **Affected backend modules** (documentation only): `auth`, `routines`, `exercises`, `session`, `room`, `chat`, `invitations`, `clients`, `events`, `prisma`.
- **Affected frontend features** (documentation only): `auth`, `chat`, `routines`, `exercises`, `workout`, `notifications`, `coach`, `client`, plus `shared/` (i18n, theming, layout, axios client).
- **Realtime surface captured**: every Socket.IO event currently emitted by `EventsGateway` (chat, notifications, WebRTC signalling) and `RoomGateway` (co-op session) becomes part of a versioned spec — future changes that add or rename events must produce a delta.
- **OpenSpec tooling**: after this change is merged, `/opsx:propose`, `/opsx:apply`, and `/opsx:verify` have a real corpus to operate on. `openspec validate` should report all new specs as well-formed.
- **Files written** (no source code touched): `openspec/config.yaml` (already updated in this change), `openspec/changes/document-baseline-architecture/{proposal.md,design.md,tasks.md}`, and one `openspec/specs/<capability>/spec.md` per capability listed above.
- **Testing impact**: no automated tests are added or removed. Each spec includes a *testability scenario* that points at either an existing manual-QA step in `doc/Proves_usuari.md` or describes the Jest test that should accompany the next behavioural change to that capability.
- **Deploy impact**: none. Production behaviour is unchanged.
- **Tracking**: tracking lives in **Jira** with hierarchy Epic → US → Tasks. Link the Jira US (and parent Epic when relevant) once created; future proposals MUST follow the same convention per `openspec/config.yaml`.
