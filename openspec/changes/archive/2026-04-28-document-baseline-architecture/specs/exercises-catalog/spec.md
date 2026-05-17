## ADDED Requirements

### Requirement: Read-only exercises catalog

The system SHALL expose a read-only `ExerciseCatalog` to authenticated Coaches and Clients. The catalog is global and shared across all routines.

#### Scenario: List all exercises

- **WHEN** any client (authenticated or anonymous) GETs `/api/exercises`
- **THEN** the response is `200 OK` with an array of catalog entries containing at least `{ id, name, description, category, primaryMuscle[], secondaryMuscle[], forceType, level, mechanic, equipment }`

**Known gap:** `GET /api/exercises` has no `@UseGuards` decorator — it is publicly accessible without a JWT token.

#### Scenario: Anonymous request

- **WHEN** an unauthenticated client GETs `/api/exercises`
- **THEN** the response is `200 OK` (the endpoint is unguarded)

### Requirement: Filter the catalog

`ExerciseSearchModal` SHALL allow Coaches to filter the catalog by free-text query and by structured fields (`primaryMuscle`, `level`, `equipment`). The backend SHALL accept the corresponding query parameters and return the filtered subset.

The frontend `ExerciseSearchModal` calls `GET /api/exercises/search` with the following query parameters (all optional): `search` (free-text, case-insensitive name contains), `level`, `category`, `force`, `mechanic`, `equipment`, `primaryMuscle`, `page` (default `1`), `limit` (default `20`).

#### Scenario: Filter by primary muscle

- **WHEN** a Coach GETs `/api/exercises/search?primaryMuscle=chest`
- **THEN** the response contains only entries whose `primaryMuscle` array includes `"chest"` (Prisma `hasSome`)

#### Scenario: Free-text search by name

- **WHEN** a Coach GETs `/api/exercises/search?search=press`
- **THEN** the response contains entries whose `name` contains `"press"` (case-insensitive)

#### Scenario: No matches

- **WHEN** a query yields no results
- **THEN** the response is `200 OK` with an empty array (NOT `404`)

### Requirement: Catalog is read-only over the API

There SHALL be no public endpoint that creates, updates, or deletes an `ExerciseCatalog` row through normal client flow. Catalog population is done via `POST /api/exercises/import` (admin-only trigger that fetches from the `wrkout/exercises.json` GitHub repository).

**Known gap:** `POST /api/exercises/import` has no authentication guard. Any client can trigger a full catalog re-import. A follow-up change should add an admin guard or remove this endpoint from the production router.

### Requirement: Search modal is internationalised

The placeholder, filter labels, and "no results" text in `ExerciseSearchModal` SHALL exist in `ca.json`, `es.json`, and `en.json`.

#### Scenario: Switching language updates the modal

- **GIVEN** the Coach has the search modal open in Catalan
- **WHEN** the language is switched to English
- **THEN** all labels, placeholders, and the empty state text re-render in English without losing the open state

### Requirement: Catalog is testable

The exercises catalog SHALL be exercisable via manual QA today, and any future automated coverage SHALL live as Jest specs under `src/back/src/exercises/` against a seeded test catalog.

#### Scenario: Manual QA + future automated coverage

- **WHEN** a developer follows "Add exercise to routine via search modal" in `doc/Proves_usuari.md`
- **THEN** filtering by muscle returns the expected subset and a selection persists into the routine
- **AND** a future Jest spec under `src/back/src/exercises/` SHOULD cover the list and filter paths with a seeded test catalog
