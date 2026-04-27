## ADDED Requirements

> **Scope note:** this capability covers BOTH the coach-side clients listing (`GET /api/clients`) AND the per-client profile detail / private notes / goals (`GET/PATCH /api/clients/:id`). There is no separate `coach-clients-listing` capability.

### Requirement: Coach views their clients

All endpoints in `/api/clients` require `AuthGuard('jwt')` (class-level guard). Role enforcement is done inside the service methods.

#### Scenario: List linked clients

- **WHEN** Coach C GETs `/api/clients`
- **THEN** the response is `200 OK` with an array of `User` records where `coachId = C.id`

#### Scenario: Coach views a specific client

- **WHEN** Coach C GETs `/api/clients/:id`
- **THEN** the response includes the client user data
- **AND** if the user `coachId != C.id` the service throws `403 Forbidden` (`"You do not have permission to view this client"`)

#### Scenario: A CLIENT calls the clients endpoint

- **WHEN** a CLIENT GETs `/api/clients`
- **THEN** the service returns only clients with `coachId = req.user.userId`; since CLIENTs never have clients, they receive an empty array (no role-check guard throws 403 at the controller level)

**Known gap:** No `CoachGuard` on `GET /api/clients`. A CLIENT could call the endpoint and get an empty array. A follow-up should add `CoachGuard`.

### Requirement: Coach maintains a private profile per client

A Coach updates the `ClientProfile` via `PUT /api/clients/:id` using `UpdateClientDto`.

**Known gap:** There is no separate `PATCH /api/clients/:id/profile` endpoint. The spec previously described that endpoint, but it does not exist. Profile notes/goals are stored via `PUT /api/clients/:id` with an `UpdateClientDto` that includes the profile fields.

#### Scenario: Coach updates private notes

- **WHEN** Coach C PUTs `/api/clients/:id` with the `UpdateClientDto` fields (which may include profile-related data)
- **THEN** the client record (and optionally the `ClientProfile`) is upserted
- **AND** the response is `200 OK`

### Requirement: Client can unlink from their coach

#### Scenario: Client unlinks voluntarily

- **WHEN** Client K DELETEs `/api/clients/me/unlink`
- **THEN** K's `coachId` is set to null (`204 No Content`)

#### Scenario: Coach unlinks a specific client

- **WHEN** Coach C DELETEs `/api/clients/:id/unlink`
- **THEN** the client's `coachId` is set to null (`204 No Content`);
- **AND** if C does not coach that client, `403 Forbidden` is returned

### Requirement: Profile UI is internationalised

The client-profile pages SHALL render every label, empty state, and action from `ca.json`, `es.json`, and `en.json` via `react-i18next`.

#### Scenario: Empty profile

- **WHEN** Coach C opens a client without a `ClientProfile` in Catalan
- **THEN** the empty-state copy and the "Crear notes" button render Catalan strings from `ca.json`

### Requirement: Client profile is testable

The client-profile capability SHALL be exercisable via manual QA today, and any future automated coverage SHALL live as Jest specs co-located in `src/back/src/clients/`.

#### Scenario: Manual QA + future automated coverage

- **WHEN** a developer runs "Coach edits client private notes" in `doc/Proves_usuari.md`
- **THEN** notes persist across reloads and remain invisible to the client account
- **AND** a future Jest spec under `src/back/src/clients/` SHOULD cover create-on-update, foreign-client guard, and visibility rules with a mocked `PrismaService`
