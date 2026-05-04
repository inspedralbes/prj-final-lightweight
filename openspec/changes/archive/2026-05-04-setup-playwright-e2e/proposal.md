## Why

LightWeight todavía no tiene tests E2E automatizados — la verificación funcional vive en `doc/Proves_usuari.md` (manual). Antes de empezar a escribir tests por flujo (LW-441–LW-444), hace falta un harness que pueda ejecutarlos. Este cambio cubre exclusivamente **LW-438**: instalar Playwright, crear el workspace, configurarlo, dejar un smoke test verde y limpiar el scaffolding huérfano de Cypress.

La elección de Playwright como framework está documentada en LW-437 (motivación: soporte nativo a múltiples contextos de navegador para los flujos cooperativos de la app).

## What Changes

- Añadir un nuevo workspace **`e2e/`** en la raíz del repo, separado de `src/front` y `src/back`, con su propio `package.json` y dependencia `@playwright/test`.
- Configurar `playwright.config.ts` para Chromium en local, con `baseURL` apuntando a `http://localhost:5173` (Firefox / WebKit / `webServer` quedan como follow-up para tickets posteriores).
- Añadir un único test smoke que valida que la home (`/`) carga y muestra el branding de LightWeight, ejecutable con `npm run test:e2e:browser` (nombre escogido para evitar colisión con el `test:e2e` ya existente en `src/back/`, que es Jest sobre HTTP del API y no Playwright sobre browser).
- Limpiar el scaffolding huérfano de Cypress: `src/front/cypress/` (carpetas vacías) y `src/front/.env.cypress.example`.
- Añadir un `e2e/README.md` **mínimo** con instrucciones de instalación y de cómo correr el smoke. La guía completa (convenciones, Trace Viewer, debugging, fixtures) es responsabilidad de LW-446 y no entra aquí.

## Capabilities

### New Capabilities

- `e2e-testing`: capacidad de ejecutar tests end-to-end automatizados sobre la aplicación. Esta entrega establece el harness mínimo (workspace + config + smoke); los tests por flujo, las fixtures multi-usuario y la documentación completa llegan en cambios posteriores asociados a LW-440 / LW-441 / LW-443 / LW-444 / LW-446.

### Modified Capabilities

- *Ninguna.* Esta entrega no modifica el comportamiento de capacidades existentes; introduce el harness para verificarlas en futuros cambios.

## Non-goals

- **No se introducen fixtures multi-usuario** (`twoUsers`, `loginViaApi`, `seedTwoLinkedUsers`). Eso es **LW-440 / LW-441 / LW-443** y trae su propio cambio OpenSpec.
- **No se escriben tests E2E por flujo.** Solo el smoke. Login (LW-441), rutinas (LW-442), FriendSession (LW-443), invitaciones+notificaciones (LW-444) van en sus tickets.
- **No se redacta la guía completa de tests E2E.** El `e2e/README.md` que se añade aquí es una nota minimalista de "cómo arrancar el smoke". La guía completa (Trace Viewer, convenciones, debugging) es **LW-446**.
- **No se introduce Vitest** (tests unitarios). Es una tarea aparte de la épica LW-436.
- **No se monta el job de CI en GitHub Actions.** Es **LW-445**.
- **No se cambia código de aplicación.** `src/front/` y `src/back/` quedan intactos; lo único que se toca fuera de `e2e/` es la limpieza de los restos de Cypress y el `.gitignore` raíz.
- **No se cubren navegadores móviles ni Firefox/WebKit.** Solo Chromium desktop en esta entrega.

## Impact

- **Affected backend modules**: ninguno se modifica. Dependencia implícita: el back debe responder en `http://localhost:3000/api` durante los tests (ya es la convención de dev), pero el smoke solo pega contra el front.
- **Affected frontend features**: ninguna se modifica. El front debe estar arrancado en `http://localhost:5173` cuando se corra la suite.
- **Realtime surface**: ningún evento Socket.IO se añade ni modifica.
- **Cross-cutting**:
  - Nuevo workspace `e2e/` en la raíz — encaja en el patrón monorepo informal del repo (`src/front`, `src/back`, npm independiente, sin pnpm workspaces).
  - `.gitignore` raíz ignora `e2e/node_modules/`, `e2e/test-results/`, `e2e/playwright-report/`, `e2e/.playwright/`.
  - Se eliminan `src/front/cypress/` y `src/front/.env.cypress.example` (huérfanos del scaffolding anterior).
- **OpenSpec tooling**: introduce la nueva capability `e2e-testing` en `openspec/specs/` cuando se archive este cambio.
- **Files written**:
  - Nuevos: `e2e/package.json`, `e2e/tsconfig.json`, `e2e/playwright.config.ts`, `e2e/.env.example`, `e2e/tests/smoke.spec.ts`, `e2e/README.md`.
  - Modificados: `.gitignore` (raíz).
  - Eliminados: `src/front/cypress/`, `src/front/.env.cypress.example`.
- **Testing impact**: introduce un nuevo runner (`@playwright/test`) ortogonal a Jest del back. No interfiere con el linting ni con `tsc -b` del front porque vive fuera de su workspace.
- **Deploy impact**: ninguno. La carpeta `e2e/` no se incluye en las imágenes Docker de producción (`Dockerfile.prod` solo copia `src/back` o `src/front`).
- **Tracking**:
  - Épica: **LW-436** — Implementación de estrategia de testing (E2E + unitarios)
  - Decisión histórica del framework: **LW-437** — Investigar y elegir framework de testing E2E (Playwright)
  - Implementación cubierta por este cambio: **LW-438** — Configurar el entorno de testing E2E en el proyecto
