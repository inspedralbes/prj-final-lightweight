# Spec: E2E Testing

## Purpose

Provide an isolated end-to-end testing workspace (`e2e/`) at the repository root using Playwright, separate from the frontend and backend source trees. The workspace supports reproducible local and CI execution, includes a minimal smoke test to verify the full browser–frontend pipeline, and has been cleaned of any prior Cypress scaffolding.

---

## Requirements

### Requirement: Workspace E2E aislado

The system SHALL provide a workspace `e2e/` at the repository root that hosts the entire end-to-end test suite with Playwright, separated from `src/front/` and `src/back/`. The workspace SHALL declare its own `package.json` with `"private": true` and `@playwright/test` as a devDependency, and SHALL be installable independently of the rest of the monorepo.

#### Scenario: Estructura del workspace

- **GIVEN** un desarrollador que clona el repositorio tras este cambio
- **WHEN** ejecuta `ls e2e/`
- **THEN** ve, como mínimo, los archivos: `package.json`, `playwright.config.ts`, `tsconfig.json`, `README.md`, `.env.example` y el directorio `tests/`
- **AND** `e2e/package.json` declara `"private": true` y `@playwright/test` como devDependency

#### Scenario: Instalación independiente

- **GIVEN** el workspace `e2e/` recién clonado y sin instalar
- **WHEN** el desarrollador ejecuta `cd e2e && npm install && npx playwright install chromium`
- **THEN** la instalación completa sin errores
- **AND** `e2e/node_modules/@playwright/test/package.json` existe
- **AND** Chromium queda instalado en la caché local de Playwright

#### Scenario: Aislamiento del frontend

- **GIVEN** el workspace `e2e/` instalado
- **WHEN** se ejecuta `cd src/front && npm run lint && npm run build`
- **THEN** ambos comandos terminan con código 0
- **AND** el bundle de producción del frontend no incluye ninguna referencia a `@playwright/test` ni a archivos de `e2e/`

---

### Requirement: Configuración de Playwright reproducible

The system SHALL define `playwright.config.ts` so that the suite behaves consistently between local development and CI environments. The config SHALL expose `baseURL` via the `PLAYWRIGHT_BASE_URL` environment variable (defaulting to `http://localhost:5173`), SHALL apply 2 retries when `process.env.CI` is set and 0 retries otherwise, and SHALL produce trace, screenshot and video artifacts on failure.

#### Scenario: baseURL configurable por entorno (default)

- **GIVEN** la variable de entorno `PLAYWRIGHT_BASE_URL` no definida
- **WHEN** se ejecuta `npm run test:e2e:browser`
- **THEN** Playwright usa `http://localhost:5173` como `baseURL` del frontend

#### Scenario: baseURL configurable por entorno (override)

- **GIVEN** la variable `PLAYWRIGHT_BASE_URL=https://staging.lightweight.daw.inspedralbes.cat` definida
- **WHEN** se ejecuta `npm run test:e2e:browser`
- **THEN** los `page.goto('/')` resuelven contra esa URL

#### Scenario: Reintentos sólo en CI

- **GIVEN** la variable de entorno `CI` no definida (entorno local)
- **WHEN** un test falla
- **THEN** Playwright **no** lo reintenta y reporta el fallo inmediato

- **GIVEN** la variable de entorno `CI=true` definida
- **WHEN** un test falla
- **THEN** Playwright lo reintenta hasta 2 veces antes de marcarlo como fallido

#### Scenario: Artefactos de debugging en fallo

- **GIVEN** un test que falla
- **WHEN** termina la ejecución
- **THEN** se genera un archivo `trace.zip` en `e2e/test-results/<test-name>/`
- **AND** se genera una captura de pantalla del momento del fallo
- **AND** se genera un vídeo de la ejecución
- **AND** `npx playwright show-report` abre un reporte HTML con todos los artefactos vinculados

---

### Requirement: Smoke test ejecutable

The system SHALL include exactly one smoke test in `e2e/tests/smoke.spec.ts` that verifies the full pipeline (Playwright → browser → frontend → DOM) without depending on database seeding or authentication. This is the only test introduced by this change; tests por flujo viven en cambios posteriores.

#### Scenario: Smoke pasa con front arrancado

- **GIVEN** el frontend arrancado en `http://localhost:5173`
- **WHEN** se ejecuta `cd e2e && npm run test:e2e:browser`
- **THEN** el comando termina con código 0
- **AND** la salida indica `1 passed`

#### Scenario: Smoke falla con front parado

- **GIVEN** el frontend **no** arrancado
- **WHEN** se ejecuta `cd e2e && npm run test:e2e:browser`
- **THEN** el comando termina con código distinto de 0
- **AND** el mensaje de error indica que el navegador no pudo conectar al `baseURL`
- **AND** se genera el `playwright-report/` con la traza del fallo

---

### Requirement: README operativo mínimo

The system SHALL include a minimal `e2e/README.md` documenting only how to install dependencies and how to run the smoke test locally. Full documentation (Trace Viewer usage, conventions, debugging guide, fixtures patterns) is **explicitly out of scope** of this change and is owned by LW-446.

#### Scenario: README cubre instalación y ejecución del smoke

- **GIVEN** `e2e/README.md` en la raíz del workspace
- **WHEN** un desarrollador lo lee
- **THEN** encuentra al menos: cómo instalar (`npm install` + `npx playwright install chromium`) y cómo correr el smoke (`npm run test:e2e:browser` con el front arrancado en `:5173`)

#### Scenario: README delega la guía completa a LW-446

- **GIVEN** `e2e/README.md` en la raíz del workspace
- **WHEN** un desarrollador lo lee
- **THEN** encuentra una nota explícita indicando que la guía completa de E2E (Trace Viewer, convenciones, debugging) llegará con LW-446
- **AND** **NO** contiene secciones detalladas sobre Trace Viewer ni convenciones de organización (eso pertenece a LW-446)

---

### Requirement: Limpieza del scaffolding anterior

The system SHALL NOT contain any residue of the previous Cypress scaffolding: the directory `src/front/cypress/` and the file `src/front/.env.cypress.example` SHALL be removed, and no source file under version control SHALL reference `cypress`.

#### Scenario: Sin restos de Cypress

- **GIVEN** el repositorio en su estado final tras este cambio
- **WHEN** se ejecuta `grep -ri "cypress" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" --include="*.yml" --exclude-dir=node_modules .`
- **THEN** el comando devuelve cero coincidencias
- **AND** la carpeta `src/front/cypress/` no existe
- **AND** `src/front/.env.cypress.example` no existe

---

### Requirement: Seed determinista de usuarios E2E

The system SHALL provide a deterministic seed script at `src/back/prisma/seed.ts`, registered under the `prisma.seed` field of `src/back/package.json` (`ts-node ./prisma/seed.ts`), that creates a fixed set of three E2E test users — `e2e_coach` (UserRole.COACH), `e2e_client_linked` (UserRole.CLIENT, with `coachId` pointing to `e2e_coach`) and `e2e_client_unlinked` (UserRole.CLIENT, `coachId = null`) — together with one `Routine` named `e2e_routine_basic` owned by the coach, one `RoutineExercise`, one `RoutineAssignment` linking the routine to `e2e_client_linked`, and one `Invitation` (`code = 'E2E-INVITE-001'`, `status = 'PENDING'`, `coachId = e2e_coach.id`, `targetClientId = e2e_client_unlinked.id`). The seed SHALL be idempotent (`upsert`-based for unique fields, `findFirst+create` for `Routine`) and re-runnable without errors.

#### Scenario: Seed inicial sobre DB sin datos `e2e_*`

- **GIVEN** una base de datos PostgreSQL sin filas con `username` que empiece por `e2e_`
- **WHEN** un desarrollador ejecuta `cd src/back && npx prisma db seed`
- **THEN** el script termina con código 0
- **AND** la tabla `users` contiene exactamente tres usuarios con `username` `e2e_coach`, `e2e_client_linked`, `e2e_client_unlinked`
- **AND** `e2e_client_linked.coach_id` es igual a `e2e_coach.id`
- **AND** existe una `Routine` con `name = 'e2e_routine_basic'` y `coach_id = e2e_coach.id` con al menos una `RoutineExercise` y una `RoutineAssignment` apuntando a `e2e_client_linked`
- **AND** existe una `Invitation` con `code = 'E2E-INVITE-001'`, `status = 'PENDING'`, `coach_id = e2e_coach.id`, `target_client_id = e2e_client_unlinked.id`

#### Scenario: Seed idempotente

- **GIVEN** un seed ya aplicado correctamente
- **WHEN** el desarrollador ejecuta `npx prisma db seed` por segunda vez
- **THEN** el script termina con código 0
- **AND** no se crean usuarios adicionales — `SELECT COUNT(*) FROM users WHERE username LIKE 'e2e_%'` devuelve exactamente 3
- **AND** los `id` de los tres usuarios `e2e_*` son los mismos que tras la primera ejecución
- **AND** `e2e_routine_basic` sigue siendo única (no se crea una segunda copia)

#### Scenario: Seed asegura `ExerciseCatalog` mínimo

- **GIVEN** una base de datos en la que `ExerciseCatalog` está vacío
- **WHEN** se ejecuta el seed
- **THEN** el script crea (vía `upsert`) al menos 5 ejercicios fijos en `ExerciseCatalog` (Push-up, Pull-up, Squat, Bench Press, Deadlift)
- **AND** la `RoutineExercise` de `e2e_routine_basic` referencia uno de esos ejercicios

---

### Requirement: Módulo de testing del backend cargado condicionalmente

The system SHALL ship a NestJS module `TestingModule` at `src/back/src/testing/` that is imported into `AppModule` if and only if `process.env.E2E_TESTING === 'true'` AND `process.env.NODE_ENV !== 'production'`. The module SHALL expose three HTTP endpoints under `/api/testing/*` and SHALL NOT be reachable when either condition fails, in which case the endpoints SHALL respond with HTTP 404. The module SHALL NOT be wrapped by `JwtAuthGuard` — it is intentionally open while active and gated solely by the env flag.

#### Scenario: Módulo activo en dev con flag

- **GIVEN** el back arrancado con `E2E_TESTING=true` y `NODE_ENV=development`
- **WHEN** se hace `POST http://localhost:3000/api/testing/reset`
- **THEN** la respuesta tiene HTTP status 200
- **AND** el body es JSON con la forma `{ reset: true, seeded: { users: [...], routines: [...], invitations: number }, durationMs: number }`

#### Scenario: Módulo inactivo sin flag

- **GIVEN** el back arrancado con `E2E_TESTING` no definida (o `false`)
- **WHEN** se hace `POST http://localhost:3000/api/testing/reset`
- **THEN** la respuesta tiene HTTP status 404
- **AND** el body es la respuesta NestJS por defecto (`Cannot POST /api/testing/reset`)

#### Scenario: Módulo inactivo en producción incluso con flag

- **GIVEN** el back arrancado con `E2E_TESTING=true` y `NODE_ENV=production`
- **WHEN** se hace `POST http://localhost:3000/api/testing/reset`
- **THEN** la respuesta tiene HTTP status 404
- **AND** los logs del servidor NO contienen ninguna entrada de `TestingController` (porque el módulo no se ha cargado)

---

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
- **AND** la DB contiene los tres usuarios `e2e_*` seedeados
- **WHEN** se hace `POST /api/testing/reset`
- **THEN** la respuesta es HTTP 200
- **AND** `SELECT COUNT(*) FROM users WHERE username = 'coach_marina'` sigue devolviendo 1
- **AND** las rutinas, asignaciones y mensajes de `coach_marina` siguen presentes (filas no borradas)
- **AND** `SELECT COUNT(*) FROM users WHERE username LIKE 'e2e_%'` devuelve 3 (los recreó el seed)

#### Scenario: Reset limpia datos huérfanos `e2e_*`

- **GIVEN** la DB tiene los tres usuarios seedeados más un cuarto usuario `e2e_extra` creado a mano por un test anterior que no limpió
- **WHEN** se hace `POST /api/testing/reset`
- **THEN** `SELECT COUNT(*) FROM users WHERE username LIKE 'e2e_%'` devuelve exactamente 3
- **AND** `e2e_extra` ya no existe

#### Scenario: Reset bajo el presupuesto de tiempo

- **GIVEN** una DB local con <1000 filas por tabla
- **WHEN** se hace `POST /api/testing/reset` y se mide el campo `durationMs` de la respuesta
- **THEN** `durationMs < 2000`

---

### Requirement: Endpoint de seed sin reset

The system SHALL expose `POST /api/testing/seed` (when the testing module is active) that runs only the seed phase (without deleting anything) and SHALL be safe to call repeatedly thanks to seed idempotency.

#### Scenario: Seed sin reset es idempotente

- **GIVEN** los tres usuarios `e2e_*` ya creados con sus relaciones
- **WHEN** se hace `POST /api/testing/seed` dos veces seguidas
- **THEN** ambas respuestas son HTTP 200
- **AND** los IDs de los tres usuarios no han cambiado entre la primera y la segunda llamada
- **AND** la tabla `users` no ha crecido

#### Scenario: Seed restaura entidades borradas a mano

- **GIVEN** los tres usuarios `e2e_*` existen pero un dev borró la `e2e_routine_basic` manualmente desde Adminer
- **WHEN** se hace `POST /api/testing/seed`
- **THEN** la respuesta es HTTP 200
- **AND** `SELECT COUNT(*) FROM routines WHERE name = 'e2e_routine_basic'` vuelve a devolver 1
- **AND** los IDs de los tres usuarios siguen siendo los mismos (no se han recreado)

---

### Requirement: Endpoint de login as

The system SHALL expose `POST /api/testing/login` (when the testing module is active) accepting a JSON body validated by `LoginAsDto` (`username: string` matching `^e2e_[a-z_]+$`). The endpoint SHALL return the same response shape as `POST /api/auth/login` (`{ access_token, user: { id, username, role, coachId } }`) for any user whose username matches the regex, by signing a JWT via `JwtService` with payload `{ userId: user.id, role: user.role }` (the same shape `AuthService.login()` produces, so the existing `JwtStrategy.validate()` accepts it without changes). The endpoint SHALL reject any username not matching `^e2e_*` with HTTP 400, and SHALL return HTTP 404 if the matching user does not exist.

#### Scenario: Login as e2e_coach

- **GIVEN** el seed aplicado y el módulo de testing activo
- **WHEN** se hace `POST /api/testing/login` con body `{ "username": "e2e_coach" }`
- **THEN** la respuesta es HTTP 200
- **AND** el body contiene `access_token` (string JWT no vacío) y `user.role === 'COACH'`
- **AND** ese mismo `access_token` autentica correctamente una llamada a un endpoint protegido por `JwtAuthGuard` (e.g. `GET /api/routines/my-routines` → HTTP 200), porque su payload `{ userId, role }` cuadra con lo que `JwtStrategy.validate()` espera

#### Scenario: Login as username no permitido

- **GIVEN** el módulo de testing activo
- **WHEN** se hace `POST /api/testing/login` con body `{ "username": "admin_real" }`
- **THEN** la respuesta es HTTP 400
- **AND** el mensaje incluye `"username must match /^e2e_[a-z_]+$/"`
- **AND** la DB no se consulta (el rechazo ocurre en el `class-validator`)

#### Scenario: Login as usuario inexistente

- **GIVEN** el módulo de testing activo y un seed que no contiene `e2e_phantom`
- **WHEN** se hace `POST /api/testing/login` con body `{ "username": "e2e_phantom" }`
- **THEN** la respuesta es HTTP 404
- **AND** el mensaje incluye `"User e2e_phantom not found"`

---

### Requirement: Fixtures Playwright multi-usuario

The E2E workspace SHALL provide reusable Playwright fixtures at `e2e/fixtures/` exporting at minimum: a typed `e2eUsers` map (with `e2eCoach`, `e2eClientLinked`, `e2eClientUnlinked`, each having `username`, `password`, `role`); a `loginViaApi(page, user)` helper that calls `POST /api/testing/login`, stores the returned `access_token` and user info in the browser's `localStorage` (matching the keys used by `AuthContext`: `token`, `userRole`, `username`, `userId`, `coachId`), and returns once `localStorage` is set; a `resetDatabase()` helper that calls `POST /api/testing/reset`; and an extended Playwright `test` (`e2e/fixtures/index.ts`) that exposes a `loginAs` fixture and an auto-running `freshDb` fixture. The fixture barrel SHALL re-export `expect` from `@playwright/test` so tests can `import { test, expect } from '../fixtures'`.

#### Scenario: Fixture `loginAs('coach')` deja sesión activa en la página

- **GIVEN** el back con `E2E_TESTING=true` arrancado en `:3000`, el front en `:5173`, y el seed aplicado
- **WHEN** un test E2E llama a `await loginAs('coach')` y luego a `await page.goto('/dashboard')`
- **THEN** la página `/dashboard` carga sin redirigir a `/login`
- **AND** `localStorage.getItem('userRole') === 'COACH'`
- **AND** `localStorage.getItem('username') === 'e2e_coach'`

#### Scenario: Fixture `freshDb` resetea antes de cada test

- **GIVEN** dos tests E2E `t1` y `t2` que comparten archivo
- **AND** `t1` crea un usuario adicional `e2e_temp` mediante el endpoint `/api/testing/seed` con un payload extendido (hipotético) — o simplemente lo crea desde la fixture
- **WHEN** `t2` empieza a ejecutarse
- **THEN** `e2e_temp` ya no existe (`POST /api/testing/login {username: "e2e_temp"}` devuelve 404)
- **AND** los tres usuarios `e2e_*` seedeados sí existen

#### Scenario: Test puede optar a no resetear

- **GIVEN** un test que necesita compartir estado con otro (`describe.serial`)
- **WHEN** el archivo declara `test.use({ freshDb: false })`
- **THEN** la fixture `freshDb` no se ejecuta entre tests del bloque y los datos persisten entre ellos

---

### Requirement: Global setup que verifica el harness

The E2E workspace SHALL define `e2e/global-setup.ts`, referenced from `playwright.config.ts` via `globalSetup`, that performs a one-time `POST` to `${PLAYWRIGHT_API_URL ?? 'http://localhost:3000/api'}/testing/reset` before the suite runs. If the request fails (network error or non-200 response), the setup SHALL throw with a clear, actionable message that names the missing piece (back not running, `E2E_TESTING` flag not set, or unexpected API response).

#### Scenario: Global setup OK

- **GIVEN** el back arrancado con `E2E_TESTING=true`
- **WHEN** Playwright arranca la suite
- **THEN** `global-setup.ts` recibe HTTP 200 de `/api/testing/reset`
- **AND** la suite continúa con los tests

#### Scenario: Global setup falla rápido si el back no responde

- **GIVEN** el back **no** arrancado
- **WHEN** Playwright intenta arrancar la suite
- **THEN** la ejecución termina antes de correr ningún test
- **AND** el mensaje de error contiene `"Backend not reachable at http://localhost:3000/api"` o equivalente claro

#### Scenario: Global setup falla si el flag está apagado

- **GIVEN** el back arrancado pero sin `E2E_TESTING=true`
- **WHEN** Playwright intenta arrancar la suite
- **THEN** la ejecución termina con error
- **AND** el mensaje incluye `"E2E_TESTING flag must be set to 'true' on the backend"` o equivalente que apunte a la causa real (404 en `/api/testing/reset`)

---

### Requirement: Variable de entorno `E2E_TESTING` documentada y `fail-closed` en producción

The repository SHALL document the `E2E_TESTING` environment variable in `.env.example` (root), `src/back/.env.example`, the GitHub Actions `ENV_FILE` template note, and the `e2e/.env.example` README. Each occurrence SHALL include an inline comment marking it as **never enable in production**. The backend SHALL refuse to load `TestingModule` when `process.env.NODE_ENV === 'production'`, even if `E2E_TESTING=true` is forced.
