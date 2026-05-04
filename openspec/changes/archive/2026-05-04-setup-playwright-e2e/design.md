# Design

> Alcance: solo **LW-438** (instalar, configurar, smoke). Las decisiones de fixtures multi-usuario, orquestación de CI, integración WebRTC, etc. viven en sus respectivos cambios (LW-440 / LW-441 / LW-443 / LW-444 / LW-445 / LW-446) y se mencionan aquí únicamente como "follow-ups" cuando ayudan a evitar pintar a este cambio en una esquina.

## Architectural decision: workspace propio vs anidado en `src/front`

**Decisión**: workspace `e2e/` en la raíz del repo.

**Alternativas consideradas**:

| Opción | Pros | Contras |
|---|---|---|
| **`e2e/` en raíz (elegida)** | Tests pueden orquestar front + back (seedear DB, llamar al API directamente) cuando llegue ese momento. Aísla deps de Playwright del bundle del front. Espejo del patrón monorepo `src/back` + `src/front`. | Una carpeta más en raíz. |
| `src/front/e2e/` | Cercano al frontend. | Mezcla deps de runtime con deps de testing. No tiene visión natural del back para seed/teardown. Cypress lo había planteado así (carpeta `src/front/cypress/`) y por eso aquí pivotamos. |
| `src/back/test/e2e` | Reutiliza el `test/` de Nest. | Anti-patrón: los E2E del back de Nest validan HTTP, no UI. Mezclaría dos cosas distintas. |

La estructura del workspace tras este cambio queda:

```
e2e/
├── package.json              (privado, dep: @playwright/test)
├── playwright.config.ts
├── tsconfig.json
├── README.md                 (mínimo: instalar + correr smoke)
├── .env.example              (PLAYWRIGHT_BASE_URL, PLAYWRIGHT_API_URL)
└── tests/
    └── smoke.spec.ts         (única pieza con código de test)
```

> **Nota**: subdirectorios `fixtures/`, `pages/`, `tests/<flow>/` etc. NO se crean en este cambio. Aparecerán cuando los tickets que los necesitan (LW-440/441/443) los introduzcan.

## Configuración de Playwright

`playwright.config.ts` mínimo viable para esta entrega:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html']] : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // webServer queda comentado: el dev arranca front+back manualmente.
  // Se decide cómo orquestarlo cuando llegue LW-445 (CI).
});
```

**Decisiones puntuales**:

- `trace: 'on-first-retry'` — equilibrio entre disco y debugging. Si el test pasa al primer intento, no se guarda traza; si falla y se reintenta, sí.
- `retries: 2 en CI, 0 en local` — convención estándar Playwright. Local hace ruido, CI tolera flakiness real.
- **Solo Chromium** en este cambio. Firefox/WebKit se añaden bajo demanda añadiendo entries en `projects[]`; no requiere cambio OpenSpec.
- `webServer` deshabilitado: orquestar postgres + back + front desde Playwright es no-trivial; se ataca mejor en LW-445.

## Smoke test

```ts
import { test, expect } from '@playwright/test';

test('home loads and shows branding', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/LightWeight/i);
});
```

Mínimo posible. Su único objetivo es verificar que toda la cadena (instalación de Playwright, baseURL, browser launch) funciona. Cualquier asserción más rica pertenece a LW-441 en adelante.

## API request/response involved

Ninguna. El único HTTP que ejecuta el smoke es un `GET /` al frontend.

## Prisma schema additions

Ninguna.

## Socket.IO events

Ninguno se añade ni se consume en este cambio. El smoke no toca sockets.

## i18n keys

Ninguna se añade.

## Testing strategy

Esta entrega introduce **el harness mismo**, así que la propia entrega es su test:

| Qué se verifica | Cómo |
|---|---|
| Playwright instalado correctamente | `cd e2e && npm install` sin errores |
| Configuración válida | `npx playwright test --list` lista el smoke |
| Smoke pasa | `npm run test:e2e:browser` con front arrancado en `:5173` |
| Workspace aislado | `cd src/front && npm run lint && npm run build` siguen verdes |
| Limpieza Cypress completa | `grep -ri cypress` en el repo (excluyendo node_modules) → vacío |

Mocks introducidos: ninguno. El smoke pega contra el front real corriendo localmente.

## Files cleanup

```
ELIMINAR:
  src/front/cypress/                       (carpetas vacías huérfanas)
    ├── e2e/
    ├── fixtures/
    └── support/
  src/front/.env.cypress.example
```

Verificación post-cleanup: `grep -ri "cypress" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" --include="*.yml" --exclude-dir=node_modules .` debe devolver cero matches.

## Deploy impact

Ninguno. `Dockerfile.prod` del front (`src/front/Dockerfile.prod`) hace `COPY src/front` y no tocaría `e2e/` aunque viviera dentro. Como vive en raíz, ni siquiera está en el contexto del build.

## Open questions / follow-ups (fuera de este cambio)

- **Fixtures multi-usuario** (`twoUsers`, `loginViaApi`, `seedTwoLinkedUsers`): se diseñan e implementan en **LW-440 / LW-441 / LW-443**. El diseño concreto del fixture `twoUsers` (dos `BrowserContext` desde un mismo `Browser`, JWT inyectado vía `addInitScript`) **no se decide aquí**.
- **CI orchestration**: **LW-445** decidirá entre `docker-compose.e2e.yml` o el `webServer` de Playwright.
- **Cross-browser**: Firefox/WebKit se añaden vía `projects[]` cuando se quiera cobertura adicional.
- **Mobile viewports**: idem, vía `devices['Pixel 5']` etc.
- **WebRTC test fakes**: el cambio que introduzca el test de video-call añadirá `--use-fake-ui-for-media-stream` y `--use-fake-device-for-media-stream` a launch options.
- **Guía completa de tests E2E** (Trace Viewer, convenciones, debugging): **LW-446**.
