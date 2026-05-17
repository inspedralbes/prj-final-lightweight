## Why

The "History & Stats" button on the Client Dashboard (`/client/history`) is currently only accessible via a button on the dashboard page — it has **no sidebar entry** under the client's "Gestió" section. Removing the dashboard button and adding a proper sidebar link improves discoverability and follows the same UX pattern as the coach sidebar. Additionally, the page does not distinguish between solo sessions and Friend Session (co-op) workouts, nor does it display any stats specific to Friend Sessions (e.g., which partners trained together, co-op-only totals, partner-level stats). Both participants in a co-op session receive the same stats — every user can see their own friend training history, including which partners they trained with.

## What Changes

- **Sidebar**: Add a new navigation item "Historial i Estadístiques" (History & Stats) to `clientNavItems` in `Layout.tsx` under the "Gestió" section, linking to the existing route `/client/history`.
- **Dashboard button removed**: Remove the "History & Stats" button from `ClientDashboard.tsx`.
- **ClientHistoryStats page**: Enhance the page with a filter tab system (All / Solo / Friend) that filters the session history table accordingly.
- **Friend Session stats section**: Add a dedicated stats card above or below the history table showing co-op-specific metrics: total co-op sessions, total co-op sets, total co-op exercises, and a list of unique training partners (username + session count per partner). Both users in a co-op session see the same co-op stats.
- **Backend**: Add a new endpoint `GET /progress/client/friend-stats` that returns co-op-specific aggregate stats and per-partner breakdown, derived from `LiveParticipant` and `SessionProgress` data. Both users in a co-op session can call this endpoint to see their own friend-session stats.
- **i18n**: Add new translation keys for the friend-stats section and filter tabs in all three locales (ca, es, en).

## Non-Goals

- Modifying the coach sidebar or any coach-side pages.
- Changing the existing solo workout or friend session UI flows (CoopSessionLobby, WorkoutRoom, etc.).
- Adding real-time sync to the history page.
- Implementing mobile-specific views.
- Adding new database models (all data already exists in `LiveSession`, `LiveParticipant`, and `SessionProgress`).

## Capabilities

### New Capabilities

- **`client-friend-stats`**: New backend endpoint and UI section that surfaces co-op-specific stats and partner-level breakdowns from existing LiveSession/LiveParticipant data. Both participants in a co-op session have their own stats view.

### Modified Capabilities

- **`client-history-stats`**: The existing `ClientHistoryStats` page spec is extended with:
  - Filter tabs (All / Solo / Friend) that slice the session history table by session type.
  - A new "Friend Stats" card/section visible alongside the aggregate stats counters.
  - Dashboard button removed; navigation moved to sidebar.

## Impact

### Backend (`src/back/`)

- **New endpoint**: `GET /progress/client/friend-stats` (`ClientGuard` → `JwtAuthGuard`)
  - Returns: `{ totalCoopSessions, totalCoopSets, totalCoopExercises, partners: [{ username, sessionCount }] }`
  - Reads: `LiveParticipant` (to get partner user IDs), `User` (to resolve usernames), `SessionProgress` / `LiveSession` (for aggregates)
  - Location: `src/back/src/progress/progress.controller.ts` + `progress.service.ts`

### Frontend (`src/front/`)

- **Layout.tsx**: Add new nav item `{ path: "/client/history", icon: BarChart2, label: t("history.navLabel") }` to `clientNavItems` under "Gestió".
- **ClientDashboard.tsx**: Remove the "History & Stats" button and the `navigate` import if no longer needed.
- **ClientHistoryStats.tsx** (`features/client/pages/`): Refactor to accept filter state, render tabs, and show friend-stats section.
- **progressService.ts** (`features/client/services/`): Add `getClientFriendStats()` method calling the new backend endpoint.
- **App.tsx**: No route changes needed (existing `/client/history` route already exists).
- **i18n** (`src/i18n/locales/{ca,es,en}.json`): New keys under `history.*` for friend stats labels and tab names.

### Socket.IO Impact

- None. This feature only reads persisted data and does not introduce new real-time events.

### Testing Note

- Backend: add a Jest unit test for `ProgressService.getClientFriendStats()` with mocked Prisma queries.
- Frontend: manual QA: complete a co-op session as two different users, log in as each user, filter the history by "Friend" tab, verify partner name appears in the stats section for both accounts.