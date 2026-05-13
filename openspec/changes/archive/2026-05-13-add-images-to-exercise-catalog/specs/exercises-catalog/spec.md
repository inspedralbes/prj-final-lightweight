## ADDED Requirements

### Requirement: Exercise catalog stores image URLs

The `ExerciseCatalog` model SHALL persist an array of image URLs (`String[]`) sourced from the GitHub wrkout/exercises.json repository during import. The field SHALL default to an empty array.

#### Scenario: Import saves image URLs for exercises that have images
- **GIVEN** the GitHub repo has exercise folders with an `images/` subdirectory containing `0.jpg` and `1.jpg`
- **WHEN** the system runs `POST /exercises/import`
- **THEN** the `ExerciseCatalog.images` field for each imported exercise SHALL contain the `download_url` values from the GitHub API response

#### Scenario: Import saves empty array for exercises without images
- **GIVEN** the GitHub repo has an exercise folder without an `images/` subdirectory
- **WHEN** the system runs `POST /exercises/import`
- **THEN** the `ExerciseCatalog.images` field for that exercise SHALL be an empty array `[]`

#### Scenario: Re-import updates image URLs
- **GIVEN** an existing exercise in the catalog with outdated image URLs
- **WHEN** the system runs `POST /exercises/import` again
- **THEN** the existing exercise SHALL have its `images` field updated with the current GitHub download URLs

### Requirement: API exposes images in all exercise responses

All REST endpoints returning exercise data SHALL include the `images` field with the full array of URLs.

#### Scenario: Search endpoint includes images
- **GIVEN** exercises exist in the catalog with images
- **WHEN** a user calls `GET /exercises/search`
- **THEN** each exercise object in the response SHALL contain an `images` array property

#### Scenario: All exercises endpoint includes images
- **GIVEN** exercises exist in the catalog with images
- **WHEN** a user calls `GET /exercises`
- **THEN** each exercise object in the response SHALL contain an `images` array property

#### Scenario: Routine detail includes images on exercises
- **GIVEN** a routine with assigned exercises
- **WHEN** a user calls `GET /routines/:id`
- **THEN** each related `RoutineExercise.exercise` object SHALL contain an `images` array property

### Requirement: Frontend displays exercise images alongside instructions

The web application SHALL render exercise images from the catalog using a reusable `ExerciseImage` component. Images SHALL be displayed alongside the exercise instructions/description in the exercise detail view, routine editor, and active workout session.

#### Scenario: Detail view shows images in a gallery
- **GIVEN** an exercise with 3 images
- **WHEN** the user opens the exercise detail in the search modal
- **THEN** the system SHALL display all 3 images in a responsive grid above or alongside the instructions text

#### Scenario: Single image displays full width
- **GIVEN** an exercise with exactly 1 image
- **WHEN** the user views the exercise detail
- **THEN** the system SHALL display the image at full column width

#### Scenario: Exercise with no images renders no image area
- **GIVEN** an exercise with an empty `images` array
- **WHEN** the user views the exercise detail or routine editor
- **THEN** the system SHALL NOT render any image element or placeholder — no visual space is occupied

#### Scenario: Routine editor exercise info shows images
- **GIVEN** a coach editing a routine in the exercises form
- **WHEN** the exercise info card is displayed (showing level, muscles, instructions)
- **THEN** the images SHALL be rendered alongside the instructions section

#### Scenario: Active session shows current exercise image
- **GIVEN** a user is in an active workout session (solo or co-op)
- **WHEN** the current exercise is displayed
- **THEN** the exercise image(s) SHALL be shown near the exercise name and set/reps information

### Requirement: Image component handles errors gracefully

The `ExerciseImage` component SHALL handle image loading failures without breaking the page layout.

#### Scenario: Broken image URL hides silently
- **GIVEN** an image URL that returns a 404 or fails to load
- **WHEN** the `ExerciseImage` component attempts to render it
- **THEN** the failed image SHALL be hidden (not displayed as a broken icon) and remaining images SHALL still render

#### Scenario: All images fail shows nothing
- **GIVEN** an exercise where all image URLs fail to load
- **WHEN** the `ExerciseImage` component renders
- **THEN** the component SHALL render nothing (same as empty array behavior)

### Requirement: Images load lazily

All exercise images SHALL use native lazy loading to avoid blocking page render.

#### Scenario: Images have loading="lazy" attribute
- **GIVEN** an exercise detail page with multiple images
- **WHEN** the page renders
- **THEN** each `<img>` element SHALL have the `loading="lazy"` attribute set

## Testability

### Scenario: Manual QA for image display
- **GIVEN** exercises have been imported via `POST /exercises/import`
- **WHEN** the user navigates to the exercise search modal, routine editor, or starts a workout session
- **THEN** images SHALL be visible alongside exercise instructions where available
- **AND** `npm run build` passes in both `src/back/` and `src/front/`
- **AND** `npx prisma validate` passes in `src/back/`
