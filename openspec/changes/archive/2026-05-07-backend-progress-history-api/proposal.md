## Why

The platform currently has no way to surface historical session data to coaches or clients. After a workout session completes, there is no API that aggregates that data for review — blocking the analytics and progress-tracking views planned for the web dashboard (Epic LW-257). This is the foundational backend change that makes the web analytics feature possible.

**Jira:** LW-258 · Epic: LW-257 (Seguimiento de Progreso y Analytics — Web)

## What Changes

- New NestJS `progress` module with `ProgressController` and `ProgressService`
- Four new REST endpoints (JWT-protected, role-gated):
  - `GET /progress/coach/clients` — coach: list of their clients with last-session date and total session count
  - `GET /progress/coach/client/:clientId` — coach: paginated session history for a specific client (routine name, date, % completed, sets completed)
  - `GET /progress/client/sessions` — client: own paginated session history (routine name, date, % completed)
  - `GET /progress/client/stats` — client: aggregated stats (total sessions, total sets completed, total exercises completed)
- Prisma schema additions to `LiveSession` / `WorkoutEvent` if required fields (`completedAt`, `completionPercentage`, `completedSets`, `completedExercises`) are missing
- OpenAPI/Swagger decorators on all new endpoints

## Capabilities

### New Capabilities
- `progress-api`: REST endpoints that expose session history and aggregated workout statistics for coaches (per-client view) and clients (own view). Data is derived from existing `LiveSession`, `LiveParticipant`, and `WorkoutEvent` entities. No new Socket.IO events.

### Modified Capabilities
<!-- None — this change adds a new module; it does not alter requirements of any existing spec. -->

## Impact

- **Backend module added**: `src/back/src/progress/` (ProgressModule, ProgressController, ProgressService, DTOs)
- **Prisma schema**: `src/back/prisma/schema.prisma` — verify and potentially add `completedAt`, `completionPercentage`, `completedSets`, `completedExercises` on `LiveSession`; if added, a new migration is required
- **Auth / guards**: uses existing `JwtAuthGuard` + `RolesGuard` (coach-only routes, client-only routes)
- **No Socket.IO impact**: all new endpoints are REST; no new events or rooms
- **Frontend**: not in scope for this task — the web analytics views will be implemented in a follow-up task under LW-257
- **Testing**: add Jest unit tests for `ProgressService` methods using a mocked `PrismaService`; add integration smoke tests for the four endpoints
