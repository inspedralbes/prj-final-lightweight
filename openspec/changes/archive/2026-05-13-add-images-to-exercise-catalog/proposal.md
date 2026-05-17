## Why

The exercise catalog already imports from GitHub (wrkout/exercises.json), which includes exercise images stored in `/exercises/{name}/images/`. The backend fetches these URLs during import but discards them — they are never persisted or displayed. Adding visual references for each exercise improves the user experience: coaches see what they're assigning, clients see proper form during workouts, and both benefit from richer exercise discovery.

## What Changes

- **Prisma**: Add `images String[]` field to `ExerciseCatalog` model
- **Backend**: Save the already-fetched GitHub image `download_url`s during `importAllExercises()`, expose `images` in `getAllExercises()` and `searchExercises()` responses
- **Frontend**: Create reusable `ExerciseImage` component that renders a gallery (1 or more images per exercise)
- **Frontend**: Integrate images alongside exercise instructions in:
  - ExerciseSearchModal detail view (when clicking an exercise)
  - ExercisesForm exercise info card (in routine editor)
  - ActiveSession (during live training)
- **Migration**: Create migration `add_images_to_exercise_catalog`
- **Re-import**: Trigger `POST /exercises/import` to populate images for existing exercises

## Capabilities

### New Capabilities

- `exercises-catalog`: Read-only catalog of exercises with filtering — now enhanced with visual gallery showing GitHub-sourced exercise images alongside instructions

### Modified Capabilities

<!-- No existing specs change requirements; this is additive to a previously unspec'd capability -->

## Impact

| Area | Details |
|---|---|
| **Backend module** | `exercises` — modify `ExercisesService.importAllExercises()` (save `images` in upsert), verify `getAllExercises()` and `searchExercises()` include the new field (auto-included by Prisma) |
| **Prisma** | `ExerciseCatalog` model — add `images String[]`, generate migration |
| **Frontend feature** | `exercises` — create `ExerciseImage` component; update `ExerciseSearchModal` detail view, `ExercisesForm` info card; add to `ActiveSession` workout view |
| **Frontend service** | No service changes needed — `images` field arrives automatically in API response since Exercise type is local |
| **i18n** | No new strings needed (images are visual, no labels) |
| **Testing** | Manual: verify imported exercises show images; verify empty state (no images → nothing rendered); verify build passes (front + back) |
