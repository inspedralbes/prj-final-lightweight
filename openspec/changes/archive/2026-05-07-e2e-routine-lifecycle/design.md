## Context

The E2E workspace (`e2e/`) uses Playwright + `TestingModule` (backend route guarded by `E2E_TESTING=true`). The seed (`src/back/src/prisma/e2e-seed.ts`) already creates `e2e_coach`, `e2e_routine_basic` (with Push-up), and five `ExerciseCatalog` entries (Push-up, Pull-up, Squat, Bench Press, Deadlift). The `freshDb` fixture resets the DB before every test.

The routines UI lives in `src/front/src/features/routines/` and is rendered inside `src/front/src/features/coach/pages/CoachDashboard.tsx`. The backend exposes REST CRUD under `/api/routines` (`RoutinesController`). No Socket.IO is involved.

Currently the `RoutineModal` and `RoutineCard` components have **no `data-testid` attributes**, so the spec must add them to make Playwright selectors stable and independent from rendered text or CSS.

## Goals / Non-Goals

**Goals:**
- Stable Playwright test suite covering the four routine lifecycle scenarios from LW-442: create, edit, delete, and form-validation error.
- `data-testid` attributes added to key interactive elements in `RoutineModal` and `RoutineCard`.
- No changes to backend routes, DB schema, or Socket.IO protocol.

**Non-Goals:**
- Testing the exercise editing sub-flow (`RoutineExercisesEdit`) — that is a separate UI page and out of scope for this ticket.
- Testing routine *assignment* to clients — covered by a future `routine-assignments` spec.
- Visual regression or cross-browser testing.

## Decisions

### Decision 1: Add `data-testid` to frontend components

**Choice**: Add `data-testid` attributes to `RoutineModal` (name input, save button, cancel button, error message) and `RoutineCard` (edit button, delete button, routine card container) instead of relying on text-based selectors.

**Rationale**: The UI copy comes from i18n keys which could change or differ by locale; `data-testid` selectors are locale-agnostic and survive copy refactors. The existing invitations spec already sets `language: 'ca'` in `localStorage` and uses Catalan text — this approach is brittle when copy changes.

**Alternative considered**: Use `getByRole` / `getByText` with fixed Catalan text (same pattern as `invitations.spec.ts`). Rejected because routine text labels appear in multiple contexts (card + modal) and `getByText` would be ambiguous.

### Decision 2: Reuse existing seed data; no new seed fixtures

**Choice**: The test creates and deletes routines dynamically via the UI, starting from the `e2e_routine_basic` baseline. No new seed entries are needed.

**Rationale**: The five exercises in the catalog are enough for "add multiple exercises" scenarios (exerc. editing is out of scope here; the create/edit modal only takes a name + optional client assignment). The seed reset (`freshDb`) ensures a clean state.

### Decision 3: `test.describe.configure({ mode: 'serial' })`

**Choice**: Run the new spec in serial mode, same as `invitations.spec.ts`.

**Rationale**: Tests share DB state — the create test leaves a routine that the edit test relies on. Parallel execution would cause race conditions.

## Risks / Trade-offs

- **No `data-testid` in current components** → The implementation step must add them before the spec can pass. If the task is split between people, the UI change must land first.
- **CoachDashboard URL** → The coach's routine list is at `/dashboard` (root `/` redirects there via `RootRedirect`). If routing changes, the spec breaks. Mitigation: use a named constant `COACH_ROUTINES_URL = '/dashboard'` in the spec.
- **Modal submit race** → `RoutineModal` uses a `setTimeout(focus, 50)` on open. Playwright's `waitForSelector` handles this; no artificial `sleep` needed.

## Migration Plan

1. Add `data-testid` attributes to `RoutineModal` and `RoutineCard` components (frontend only).
2. Write `e2e/tests/routines.spec.ts`.
3. Run `cd e2e && npx playwright test routines.spec.ts` locally against Docker Compose stack.
4. PR to `main`; CI/CD does not yet run Playwright automatically — manual smoke check suffices.

## Open Questions

- Should `data-testid` follow the pattern `routine-modal-*` and `routine-card-*`? Yes — namespace by component to avoid collisions with future specs.
- Does the delete flow show a browser `confirm()` dialog or a custom modal? Current code uses `window.confirm` (see `CoachDashboard.tsx` `handleDeleteClick`). Playwright handles this via `page.on('dialog', d => d.accept())`.
