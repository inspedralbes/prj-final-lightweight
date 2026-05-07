## Why

The routine creation and editing flow is a core coach capability but has no automated E2E coverage. Adding these tests closes the gap in the Playwright suite and ensures that routine lifecycle operations (create, edit, delete) and form validation work correctly end-to-end against the real backend.

## What Changes

- Add a new Playwright spec file `e2e/tests/routines.spec.ts` covering the full CRUD lifecycle of a training routine.
- Add seeded E2E test data (coach + exercise catalog entries) if not already present in the seed module.
- Extend the existing `TestingModule` seed endpoint (or add a minimal fixture helper) for routine-related pre-conditions if needed.

## Capabilities

### New Capabilities

- `e2e-routine-lifecycle`: E2E test suite covering the coach routine CRUD flow — create a routine with multiple exercises, edit it, delete it, and validate required-field errors in the form.

### Modified Capabilities

<!-- No existing spec-level requirements change. The existing e2e-testing and routines backend/frontend behaviour remain unchanged. -->

## Impact

- **Frontend feature**: `routines` (RoutineExercisesEdit, RoutineCard, RoutineModal, RoutineList pages under `features/routines/`)
- **Backend module**: `routines` (RoutinesController, RoutinesService — CRUD endpoints)
- **E2E workspace**: `e2e/tests/routines.spec.ts` added; `e2e/` fixtures may be extended with routine seed helpers.
- **No Socket.IO impact**: routine CRUD uses REST only; no new Socket.IO events.
- **No schema changes**: the `Routine` / `RoutineExercise` models are untouched.
- **Jira**: LW-442
