## 1. Schema & Migration

- [x] 1.1 Add `images String[] @default([])` to `ExerciseCatalog` model in `src/back/prisma/schema.prisma`
- [x] 1.2 Generate migration: `docker exec -it lw-backend npx prisma migrate dev --name add_images_to_exercise_catalog`

## 2. Backend — Save images during import

- [x] 2.1 In `src/back/src/exercises/exercises.service.ts`, add `images: imgUrl` to the `create` object in the `upsert` call (line ~101)
- [x] 2.2 Add `images: imgUrl` to the `update` object in the same `upsert` call (line ~99)

## 3. Frontend — Create ExerciseImage component

- [x] 3.1 Create `src/front/src/features/exercises/components/ExerciseImage.tsx` with:

## 4. Frontend — Integrate in ExerciseSearchModal

- [x] 4.1 Add `images?: string[]` to the local `Exercise` interface in `src/front/src/features/exercises/components/ExerciseSearchModal.tsx`
- [x] 4.2 Add `<ExerciseImage images={selectedExercise.images || []} />` in the detail view section (before/above the Instructions block, around line 609)

## 5. Frontend — Integrate in ExercisesForm

- [x] 5.1 Add `images?: string[]` to the `ExerciseItem` type in `src/front/src/features/exercises/components/ExercisesForm.tsx` (line 11-26)
- [x] 5.2 Map `images` from the search modal's `onSelectMultiple` callback (lines 420-448) — add `images: ex.images` to both the existing and new exercise objects
- [x] 5.3 Add `<ExerciseImage images={ex.images || []} />` in the exercise info card (within the info box around line 252, above instructions)

## 6. Frontend — Integrate in RoutineExercisesEdit

- [x] 6.1 Add `images?: string[]` to the `RoutineExercise` interface in `src/front/src/features/routines/pages/RoutineExercisesEdit.tsx` (line 12-28)
- [x] 6.2 Map `images` from the API response in the `load` function (around line 72-87)

## 7. Frontend — Integrate in ActiveSession workout

- [x] 7.1 Add `<ExerciseImage images={selectedRoutine.exercises[currentExerciseIdx].exercise.images || []} />` in `src/front/src/features/workout/components/ActiveSession.tsx` within the current exercise display block (around line 320, after exercise name)

## 8. Verification

- [x] 8.1 Run `npx prisma validate` in backend to confirm schema is valid
- [x] 8.2 Run `npm run lint` and `npm run build` in `src/back/`
- [x] 8.3 Run `npm run lint` and `npm run build` in `src/front/`
- [x] 8.4 Manual smoke test: import exercises, open search modal, click an exercise with images → verify images appear
- [x] 8.5 Manual smoke test: edit a routine → verify images appear in exercise info cards
- [x] 8.6 Manual smoke test: start a solo workout → verify images appear during the session
- [x] 8.7 Manual smoke test: find an exercise with no images → verify nothing is rendered (no broken placeholder)

## 9. Final import (last step — rate-limited)

- [x] 9.1 After all code is implemented and verified, trigger the import: `curl -X POST http://localhost:3000/exercises/import` (or through the Docker backend) — this populates image URLs for all existing exercises in the DB
