## Why

Currently, Friend Sessions (co-op workout sessions between friends) synchronize progress in real-time via Socket.IO, but this state is not persisted to the database. When a session completes, the progress data exists only in memory and is lost. This prevents users from viewing their session history or analytics (LW-258), as there's no persisted data to query. This task implements the persistence layer required for those downstream features.

## What Changes

- Add new Prisma model `SessionProgress` to store per-user progress at session completion
- Modify `RoomGateway` to persist progress when `room:complete` event is received
- Handle partial progress for abandoned sessions (when a participant leaves before completion)
- Create Prisma migration for the new model

## Capabilities

### New Capabilities
- `session-progress-persistence`: Persists per-user workout progress to PostgreSQL when Friend Sessions complete

### Modified Capabilities
- `coop-session`: Extends existing capability to persist progress data to database (no spec changes, implementation only)
- `progress-api`: This capability now has the required data source (LW-258 will depend on this)

## Impact

- **Backend modules affected**: `room` (RoomGateway), `session` (LiveSession model)
- **Frontend features affected**: None (backend-only, UI already covered by LW-279)
- **Database**: New `SessionProgress` table, migration required
- **Socket.IO**: `room:complete` event handler now persists data to DB

## Non-Goals

- This does NOT implement PRs (personal records) tracking
- This does NOT add physical metrics (heart rate, calories, etc.)
- This does NOT include any mobile logic
- This does NOT build the history API endpoints (those are LW-258)

## Linked Issues

- **LW-288**: Persist Friend Session progress to PostgreSQL (this task)
- **LW-257**: Epic for friend sessions and progress tracking
- **LW-258**: Progress history API (depends on this)
- **LW-279**: UI for session summary (already done, this is backend-only)