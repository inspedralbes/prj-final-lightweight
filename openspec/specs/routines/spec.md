## ADDED Requirements

### Requirement: Coach creates and manages routines

A Coach SHALL be able to create, list, view, edit, and delete `Routine` records they own. Routines SHALL contain an ordered list of `RoutineExercise` items each pointing at an entry in the `ExerciseCatalog`.

#### Scenario: Create a routine (with optional exercises and assignments)

- **GIVEN** an authenticated Coach C
- **WHEN** C POSTs `/api/routines/create` with `{ name: "Push Day", exercises?: ExerciseDto[], clientIds?: number[] }`
- **THEN** the system creates a `Routine` with `coachId = C.id`, the given `name`, `isPublic = false` (schema default), and the supplied exercises
- **AND** if `clientIds` is provided, `RoutineAssignment` rows are created and each listed client's `coachId` is set to C
- **AND** the response is `201 Created` with the full routine (including exercises and assignment list)

**Known gap:** `isPublic` is a schema field (default `false`) but is NOT exposed in `CreateRoutineDto` or `UpdateRoutineDto`. There is currently no API endpoint to toggle visibility. A follow-up change should add `isPublic` to the DTOs.

#### Scenario: List own routines

- **WHEN** Coach C GETs `/api/routines`
- **THEN** the response contains only routines where `coachId = C.id` (guarded by `CoachGuard`)

#### Scenario: Client lists assigned routines

- **WHEN** a CLIENT GETs `/api/routines/my-routines`
- **THEN** the response contains routines where a `RoutineAssignment` row links `routineId` to the caller's `userId`

#### Scenario: Update routine name or exercises

- **WHEN** Coach C PUTs `/api/routines/:id/edit` with `{ name?, exercises?, clientIds? }` for a routine they own
- **THEN** the name updates (if provided); the full exercise list is replaced (delete-all + re-insert); assignments are replaced if `clientIds` is provided
- **AND** the response is `200 OK` with the updated routine

#### Scenario: Coach edits another coach's routine

- **WHEN** Coach D PUTs `/api/routines/:id/edit` for a routine where `coachId != D.id`
- **THEN** the response is `403 Forbidden`

#### Scenario: Delete cascades to exercises and assignments

- **WHEN** Coach C DELETEs `/api/routines/:id`
- **THEN** the routine row is deleted
- **AND** `RoutineExercise` rows are removed both by the service (explicit `deleteMany`) and by `onDelete: Cascade` in the schema
- **AND** `RoutineAssignment` rows are removed via `onDelete: Cascade`
- **AND** the response is `200 OK` with the deleted routine object

#### Scenario: CLIENT without a coach creates a solo routine

- **WHEN** a CLIENT with `coachId = null` POSTs `/api/routines/create`
- **THEN** the system creates a `Routine` with `coachId = null` and auto-assigns it to the caller via a `RoutineAssignment` row
- **AND** the response is `201 Created`

#### Scenario: CLIENT with a coach tries to create a routine

- **WHEN** a CLIENT with an assigned coach POSTs `/api/routines/create`
- **THEN** the response is `403 Forbidden` with message `"Los clientes con entrenador asignado no pueden crear rutinas propias"`

### Requirement: Coach manages routine exercises

Exercises are managed as part of the routine create/update call. There are no standalone exercise sub-routes (`/routines/:id/exercises`). On `PUT /api/routines/:id/edit`, passing an `exercises` array replaces the full exercise list for that routine.

Each `ExerciseDto` carries: `name` (string), `exerciseId?` (optional — if omitted the service looks up or creates an `ExerciseCatalog` row by name), `sets`, `reps`, `rest` (seconds), `notes?`. The array index determines the implicit `order`.

#### Scenario: Add an exercise to a routine

- **GIVEN** a routine `R` owned by Coach C
- **WHEN** C PUTs `/api/routines/:id/edit` with `{ exercises: [{ name: "Bench Press", sets: 4, reps: 10, rest: 90 }] }`
- **THEN** all existing `RoutineExercise` rows for `R` are deleted and the new list is inserted
- **AND** if `exerciseId` is omitted, the service looks up `ExerciseCatalog` by name, creating it if not found
- **AND** the response is `200 OK` with the full updated routine

#### Scenario: Exercise with an explicit `exerciseId`

- **WHEN** `exerciseId` is provided in the DTO
- **THEN** the service uses that id directly (no catalog lookup or creation)

### Requirement: Global (unassigned) routines

The system SHALL expose a `GET /api/routines/global` endpoint returning all `Routine` rows that have zero `RoutineAssignment` records. This is used by coaches to see routines not yet assigned to any client.

**Known gap:** The `isPublic` schema field (default `false`) is returned in API responses but is not settable through any current endpoint. The "Public routines" concept (coaches sharing routines with other coaches) is partially modelled in the schema but not implemented in any route or UI. A follow-up change should implement this.

#### Scenario: Coach reads a global routine

- **WHEN** any authenticated user GETs `/api/routines/global`
- **THEN** the response is the list of routines that have no `RoutineAssignment` rows (guarded by `JwtAuthGuard`)

#### Scenario: Coach D edits a routine they do not own

- **WHEN** Coach D PATCHes the same routine
- **THEN** the response is `403 Forbidden`

### Requirement: Routine UI is internationalised

The routine list, modal, and exercises edit page SHALL render all labels, placeholders, validation errors, and confirmation dialogs from `ca.json`, `es.json`, and `en.json`.

#### Scenario: Empty-routine empty state

- **WHEN** a Coach with zero routines opens the routines page in `en`
- **THEN** the empty state text matches the English string in `en.json`

### Requirement: Routines are testable

The routine CRUD and exercise-management flows SHALL be exercisable via manual QA today, and any future automated coverage SHALL live as Jest specs under `src/back/src/routines/`.

#### Scenario: Manual QA + future automated coverage

- **WHEN** a developer follows the "Create routine and add exercises" QA steps in `doc/Proves_usuari.md`
- **THEN** the routine appears in the list and on the dashboard
- **AND** a future Jest spec under `src/back/src/routines/` SHOULD cover create, list, update, delete, add-exercise, and the foreign-routine guard using a mocked `PrismaService`
