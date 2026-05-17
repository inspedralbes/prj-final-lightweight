# Tasks — setup-playwright-e2e

> **Tracking**: épica LW-436 · implementación **LW-438**
>
> Alcance estricto de LW-438: instalar Playwright, crear workspace `e2e/`, configurar `playwright.config.ts`, smoke test, limpieza del scaffolding Cypress, documentación mínima de "cómo correr".
>
> **Fuera de scope** (no tocar en este cambio):
>
> - Fixtures multi-usuario (`twoUsers`, `loginViaApi`, `seedTwoLinkedUsers`) → LW-440 / LW-441 / LW-443.
> - Guía de tests E2E completa, convenciones, Trace Viewer documentado → **LW-446**.
> - Integración en CI → **LW-445**.
> - Manual QA en `doc/Proves_usuari.md` → **LW-446**.

## 1. Limpieza del scaffolding anterior (Cypress)

- [x] Eliminar la carpeta `src/front/cypress/` y todos sus subdirectorios vacíos (`e2e/`, `fixtures/`, `support/`).
- [x] Eliminar `src/front/.env.cypress.example`.
- [x] Verificar que no quedan referencias: `grep -ri "cypress" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" --include="*.yml" --exclude-dir=node_modules .` → debe devolver vacío.

## 2. Crear el workspace `e2e/`

- [x] Crear directorio `e2e/` en la raíz del repo.
- [x] Añadir `e2e/package.json` privado (`"private": true`, scripts `test:e2e:browser`, `test:e2e:browser:ui`, `test:e2e:browser:debug`). El sufijo `:browser` distingue estos tests del `test:e2e` ya existente en `src/back/` (Jest sobre HTTP del API).
- [x] Añadir `e2e/tsconfig.json` mínimo (target ES2022, moduleResolution Node, strict).
- [x] `cd e2e && npm install -D @playwright/test`.
- [x] `npx playwright install chromium` (descarga el navegador local).
- [x] Actualizar `.gitignore` raíz para incluir `e2e/node_modules/`, `e2e/test-results/`, `e2e/playwright-report/`, `e2e/.playwright/`.

## 3. Configuración de Playwright

- [x] Crear `e2e/playwright.config.ts` con la config descrita en `design.md` (testDir, timeout, retries, reporter, use, projects).
- [x] Crear `e2e/.env.example` con `PLAYWRIGHT_BASE_URL=http://localhost:5173` y `PLAYWRIGHT_API_URL=http://localhost:3000/api`.
- [x] Asegurar que la config lee `process.env.PLAYWRIGHT_BASE_URL` con fallback al default local.

## 4. Smoke test

- [x] Crear `e2e/tests/smoke.spec.ts` con un único `test('home loads and shows branding')` que hace `page.goto('/')` y asserta `toHaveTitle(/LightWeight/i)`.

## 5. Documentación mínima

> El criterio de aceptación de LW-438 pide que la configuración esté "documentada". Aquí se cubre lo **mínimo**: cómo instalar y cómo correr el smoke. La guía completa (Trace Viewer, convenciones, fixtures, debugging) es responsabilidad de **LW-446**.

- [x] Crear `e2e/README.md` corto con:
  - Cómo instalar (`npm install` + `npx playwright install chromium`).
  - Cómo correr el smoke en local (incluye nota: arrancar front en `:5173` antes).
  - Apuntar explícitamente que la guía completa de E2E vive en LW-446 (cuando se cierre).

## 6. Verificación

- [x] `cd e2e && npx playwright test --list` lista exactamente 1 test (smoke).
- [x] `cd e2e && npm run test:e2e:browser` con front local arrancado → 1 passed.
- [x] `cd src/front && npm run lint && npm run build` sigue verde tras el cleanup de `cypress/`.
- [x] `cd src/back && npm run lint && npm run build` sigue verde (sanity: no se tocó el back).
- [x] `grep -ri "cypress" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" --include="*.yml" --exclude-dir=node_modules .` → vacío.
