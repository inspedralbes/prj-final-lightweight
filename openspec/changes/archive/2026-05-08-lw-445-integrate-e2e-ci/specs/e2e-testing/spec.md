## Requisitos AÑADIDOS

### Requisito: Suite E2E ejecutable en CI sin intervención manual

El sistema DEBE soportar la ejecución de la suite E2E completa en un entorno de runner de GitHub Actions donde: el frontend se sirve vía Vite dev/preview en `http://localhost:5173`; el backend corre en `http://localhost:3000` con `E2E_TESTING=true` y `NODE_ENV=test`; PostgreSQL 17 está disponible en `localhost:5432`; y no hay secrets de producción presentes. `playwright.config.ts` y `e2e/global-setup.ts` ya satisfacen este requisito leyendo `PLAYWRIGHT_BASE_URL` y `PLAYWRIGHT_API_URL` desde variables de entorno — este requisito convierte la ejecución en CI en un criterio de aceptación formal.

#### Scenario: Suite completa pasa en el entorno de CI

- **GIVEN** el stack efímero descrito (PostgreSQL service container, backend nativo, Vite dev)
- **AND** `PLAYWRIGHT_BASE_URL=http://localhost:5173` y `PLAYWRIGHT_API_URL=http://localhost:3000/api` definidos
- **AND** `E2E_TESTING=true` definido en el proceso del backend
- **WHEN** se ejecuta `cd e2e && npx playwright test` en el runner
- **THEN** el comando termina con código 0
- **AND** todos los tests existentes en `e2e/tests/` pasan (incluidos los multi-usuario que usan `twoUsers` fixture)

#### Scenario: Global setup verifica el harness antes de los tests en CI

- **GIVEN** el backend arrancado en el runner con `E2E_TESTING=true`
- **WHEN** Playwright inicializa la suite (ejecuta `global-setup.ts`)
- **THEN** `global-setup.ts` recibe HTTP 200 de `POST /api/testing/reset`
- **AND** la suite continúa con los tests normalmente

#### Scenario: Retries activos en CI — test flaky no bloquea inmediatamente

- **GIVEN** `CI=true` definido en el entorno del runner
- **AND** un test que falla en su primera ejecución por timing
- **WHEN** Playwright lo reintenta (hasta 2 veces según `playwright.config.ts`)
- **THEN** si pasa en el segundo o tercer intento, el test se reporta como `flaky` (pasó con retry)
- **AND** el job termina con código 0 (flaky ≠ failure en Playwright por defecto)
- **AND** si falla las 3 veces, el test se reporta como `failed` y el job termina con código distinto de 0
