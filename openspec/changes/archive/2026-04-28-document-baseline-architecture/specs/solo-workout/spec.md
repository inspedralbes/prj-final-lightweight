## ADDED Requirements

### Requirement: Client runs an assigned routine alone

A Client SHALL be able to start a solo workout from any of their assigned routines. The flow is fully client-side: the frontend `SoloWorkoutSession` page tracks per-set progress without requiring a `LiveSession` row.

#### Scenario: Start a solo session

- **GIVEN** Client K with at least one assigned routine `R`
- **WHEN** K opens `R` and navigates to `/workout/:id`
- **THEN** the SPA runs a 3-second countdown, then renders `ActiveSession` with `isSoloMode=true` showing the first exercise in `order` ascending
- **AND** the page shows `sets`, `reps`, `rest` per the `RoutineExercise` row

#### Scenario: Coach or CLIENT accesses the solo session route

- **WHEN** any authenticated user (COACH or CLIENT) navigates to `/workout/:id`
- **THEN** the `<ProtectedRoute>` (no `requiredRole` restriction) allows the navigation
- **AND** both roles can run a solo workout

**Known gap:** The route is accessible to COACHes as well as CLIENTs. A follow-up change should decide if COACHes should be blocked.

### Requirement: Per-set tracking

The page allows the client to record weight and reps for each set and complete them one by one.

#### Scenario: Mark a set complete

- **WHEN** the Client fills in `weight` and `reps` inputs and clicks the complete-set button
- **THEN** the volume total is incremented by `weight × reps`
- **AND** if there are remaining sets, the set counter advances to the next set
- **AND** if the last set of the exercise was just completed, the page advances to the next exercise
- **AND** if it was the last exercise, `onSessionFinished` is called with `{ time, volume, exercises }`

**Known gap:** There is no automated per-set rest timer. The `rest` field from `RoutineExercise` is displayed but not used to start a countdown. A follow-up change could add an optional rest-timer after each set.

#### Scenario: Missing weight or reps

- **WHEN** the Client clicks complete-set without filling in `weight` or `reps`
- **THEN** an error toast is shown and the set is NOT counted

#### Scenario: Elapsed time stopwatch

- **WHEN** the session is active
- **THEN** a stopwatch counts elapsed seconds. The user can pause/resume it via a button.
- **AND** the total time is included in the session summary on finish

### Requirement: End-of-session summary

When all exercises are completed (or the user ends the session early), the system SHALL show a summary of the completed work.

#### Scenario: Complete summary

- **GIVEN** the Client just marked the final set of the final exercise
- **WHEN** the page renders the `SessionSummary` component
- **THEN** the summary lists each exercise with completed sets and total elapsed time
- **AND** an action navigates back to the dashboard

#### Scenario: Early end

- **WHEN** the user clicks "Acabar sessió" mid-session
- **THEN** a confirmation modal appears (i18n strings from `ca.json`/`es.json`/`en.json`)
- **AND** confirming shows the summary with the work completed up to that point

### Requirement: Solo workout UI is internationalised

Every label, action, confirmation modal, and summary heading on the solo workout pages SHALL render from `ca.json`, `es.json`, and `en.json`.

#### Scenario: All states translated

- **WHEN** the Client switches to Spanish during a session
- **THEN** "Set fet", "Saltar descans", "Acabar sessió", confirmation copy, and the summary headers all re-render in Spanish

### Requirement: Solo workout is testable

The solo workout flow SHALL be exercisable via manual QA today, and any future automated coverage SHALL live in a Vitest + React Testing Library suite once that harness is introduced.

#### Scenario: Manual QA + future automated coverage

- **WHEN** a developer follows "Run solo workout" in `doc/Proves_usuari.md`
- **THEN** completing all sets of a multi-exercise routine produces a non-empty summary
- **AND** a future Vitest + React Testing Library suite (when the harness is introduced) SHOULD cover set advancement, rest-timer cancellation, and summary rendering
