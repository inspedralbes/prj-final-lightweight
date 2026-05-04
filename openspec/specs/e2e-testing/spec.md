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
