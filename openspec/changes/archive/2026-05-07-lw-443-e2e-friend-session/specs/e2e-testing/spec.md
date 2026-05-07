## MODIFIED Requirements

### Requirement: Endpoint de reset E2E

The system SHALL expose `POST /api/testing/reset` (when the testing module is active) that deletes every row in `LiveSession`, `LiveParticipant`, `WorkoutEvent`, `ChatMessage`, `Invitation`, `Routine`, `RoutineExercise`, `RoutineAssignment`, `ClientProfile`, `P2PChatMessage` whose foreign keys reach a `User` whose `username` starts with `e2e_`, then deletes those `User` rows themselves, and finally re-applies the deterministic seed. The endpoint SHALL NOT delete any `User` whose username does not match `^e2e_`. The endpoint SHALL complete in less than 2000 ms on a local PostgreSQL with fewer than 1000 rows per table. **The explicit deletion order for `LiveSession`-scoped rows SHALL be: `WorkoutEvent` → `ChatMessage` (session-level) → `LiveParticipant` → `LiveSession`**, to respect foreign key constraints before `User` rows are deleted.

#### Scenario: Reset limpia LiveSessions de usuarios e2e

- **GIVEN** la DB contiene un `LiveSession` creado durante un test de co-op con `hostId = e2e_coach.id`
- **AND** la DB contiene `LiveParticipant`, `WorkoutEvent` y `ChatMessage` (de sesión) asociados a esa `LiveSession`
- **WHEN** se hace `POST /api/testing/reset`
- **THEN** la respuesta es HTTP 200
- **AND** `SELECT COUNT(*) FROM live_sessions WHERE host_id = (SELECT id FROM users WHERE username = 'e2e_coach')` devuelve 0
- **AND** `SELECT COUNT(*) FROM live_participants WHERE session_id IN (...)` devuelve 0
- **AND** los tres usuarios `e2e_*` han sido recreados con sus relaciones base

#### Scenario: Reset no toca usuarios reales

- **GIVEN** la DB contiene un usuario real `coach_marina` (sin prefijo `e2e_`) con sus rutinas, asignaciones y mensajes
- **AND** la DB contiene los tres usuarios `e2e_*` seedeados con una `LiveSession` activa
- **WHEN** se hace `POST /api/testing/reset`
- **THEN** la respuesta es HTTP 200
- **AND** `SELECT COUNT(*) FROM users WHERE username = 'coach_marina'` sigue devolviendo 1
- **AND** las rutinas, asignaciones y mensajes de `coach_marina` siguen presentes
- **AND** `SELECT COUNT(*) FROM users WHERE username LIKE 'e2e_%'` devuelve 3 (los recreó el seed)

#### Scenario: Reset limpia datos huérfanos e2e

- **GIVEN** la DB tiene los tres usuarios seedeados más un cuarto usuario `e2e_extra` creado a mano por un test anterior que no limpió
- **WHEN** se hace `POST /api/testing/reset`
- **THEN** `SELECT COUNT(*) FROM users WHERE username LIKE 'e2e_%'` devuelve exactamente 3
- **AND** `e2e_extra` ya no existe

#### Scenario: Reset bajo el presupuesto de tiempo

- **GIVEN** una DB local con <1000 filas por tabla
- **WHEN** se hace `POST /api/testing/reset` y se mide el campo `durationMs` de la respuesta
- **THEN** `durationMs < 2000`
