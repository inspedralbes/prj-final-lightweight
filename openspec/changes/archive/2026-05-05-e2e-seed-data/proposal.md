## Why

LW-438 dejó listo el harness de Playwright (`e2e/`) con un único smoke test que no toca la base de datos. Antes de poder escribir los tests por flujo (LW-441 login, LW-442 rutinas, LW-443 FriendSession, LW-444 invitaciones), hace falta un mecanismo fiable para **crear y limpiar usuarios y datos de prueba** entre runs, evitando que los tests dependan del estado real de la DB de desarrollo y se contaminen entre ellos.

Hoy no existe ningún script `prisma db seed`, ningún endpoint de testing, ni ninguna fixture multi-usuario en `e2e/`. Los tests por flujo no pueden empezar sin esta base.

Tracking: épica **LW-436** (testing setup) · ticket **LW-440**.

## What Changes

- Añadir un script de **seed determinista** en `src/back/prisma/seed.ts` que crea un set fijo de usuarios E2E (`e2e_coach`, `e2e_client_linked`, `e2e_client_unlinked`), su `ClientProfile`, una rutina del coach (`e2e_routine_basic`), una asignación de rutina y una invitación pendiente. El seed es **idempotente** (`upsert`) y se invoca con `npx prisma db seed`.
- Registrar el seed en `src/back/package.json` bajo el campo `prisma.seed` (`ts-node ./prisma/seed.ts`) para que `npx prisma db seed` funcione sin argumentos.
- Añadir un **módulo de testing del back** (`src/back/src/testing/testing.module.ts` + `testing.controller.ts`) que expone:
  - `POST /api/testing/reset` — borra todos los datos generados por E2E (filtrado por usernames con prefijo `e2e_*` y por sus relaciones en cascada) y vuelve a aplicar el seed determinista.
  - `POST /api/testing/seed` — aplica solo el seed (sin borrar nada del resto del estado).
  - `POST /api/testing/login` — atajo para devolver un JWT directamente para uno de los usuarios `e2e_*` por username (sin pasar por bcrypt+UI). Útil para `loginViaApi`.
  - El módulo se monta **solo cuando `process.env.E2E_TESTING === 'true'`** (chequeo en `AppModule`). En producción no existe.
- Añadir fixtures Playwright en **`e2e/fixtures/`**:
  - `users.ts` — diccionario tipado con los usuarios seed (`e2eCoach`, `e2eClientLinked`, `e2eClientUnlinked`) + sus credenciales.
  - `auth.ts` — fixture `loginViaApi(role)` que llama a `POST /api/testing/login`, guarda el `access_token` en `localStorage` y devuelve la `Page` ya autenticada (sin pasar por `/login`).
  - `reset.ts` — helper `resetDatabase()` que llama a `POST /api/testing/reset` antes/después de cada test.
- Extender `e2e/playwright.config.ts` con `globalSetup` que verifica que el back está arrancado y reseteado antes de la suite, y `globalTeardown` opcional para una limpieza final.
- Documentar en `e2e/README.md` la nueva sección "Datos de prueba": cómo arrancar el back con `E2E_TESTING=true`, cómo correr el seed, qué usuarios existen, cómo resetear entre tests. La guía completa de patrones (Trace Viewer, debugging, page objects) sigue siendo responsabilidad de **LW-446**.
- Añadir `E2E_TESTING` a los `.env.example` (raíz y `src/back/`) y a la plantilla `ENV_FILE` de GitHub Actions, marcado claramente como **NUNCA activar en producción**.

## Capabilities

### New Capabilities

*Ninguna.* Esta entrega extiende la capability `e2e-testing` introducida en LW-438; no abre una nueva.

### Modified Capabilities

- `e2e-testing`: añadir requisitos sobre seed determinista, módulo de testing del back, fixtures multi-usuario y reset entre runs. La capability hoy solo define workspace, config y smoke test (LW-438); este cambio le añade el contrato de datos de prueba que LW-441/442/443/444 consumirán.

## Impact

- **Affected backend modules**:
  - `prisma` — nuevo `seed.ts` y entrada `prisma.seed` en `package.json`.
  - **Nuevo módulo `testing`** (`src/back/src/testing/`): `TestingModule`, `TestingController`, `TestingService`. Solo se importa en `AppModule` cuando `E2E_TESTING=true`. **No** lleva ningún guard JWT (es deliberadamente abierto cuando está activo, porque el flag solo se enciende en entornos de test).
  - `auth` — sin cambios en lógica; `TestingService` reutiliza `JwtService` y la convención `userId` para emitir tokens equivalentes a los de `/auth/login`.
- **Affected frontend features**: ninguna. El front no necesita saber nada de los endpoints `/testing/*`; los consumen únicamente las fixtures Playwright. `src/front/` queda intacto.
- **Affected E2E workspace** (`e2e/`):
  - Nuevo directorio `e2e/fixtures/` con `users.ts`, `auth.ts`, `reset.ts`.
  - `playwright.config.ts` actualizado con `globalSetup`.
  - `e2e/.env.example` extendido con `PLAYWRIGHT_API_URL` (ya existe) y referencia a `E2E_TESTING=true` en el back.
- **Realtime surface**: ningún evento Socket.IO se añade ni modifica. Las invitaciones seedeadas existen sólo en la DB (estado `PENDING`); no se emiten eventos `notification:new` durante el seed.
- **Database**: no hay cambios de schema Prisma — el seed solo usa modelos existentes (`User`, `ClientProfile`, `Routine`, `RoutineExercise`, `RoutineAssignment`, `Invitation`, `ExerciseCatalog`). El `ExerciseCatalog` debe estar poblado previamente; si la tabla está vacía, el seed inserta también 5 ejercicios mínimos para que la rutina seedeada tenga `RoutineExercise` válidos.
- **Cross-cutting**:
  - Nuevo env var `E2E_TESTING` (boolean) que activa el módulo de testing. Documentado en raíz `.env.example`, `src/back/.env.example` y la plantilla del secret `ENV_FILE` con un comentario explícito de "**NO activar en prod**".
  - `docker-compose.yml` (dev) gana la línea `E2E_TESTING: ${E2E_TESTING:-false}` en el servicio `lw-backend` para poder encenderlo desde el `.env` local.
  - `docker-compose.prod.yml` **NO** se toca (debe seguir sin la variable; si alguien la fuerza, AppModule la ignora porque `process.env.NODE_ENV === 'production'` añade un fail-closed extra).
- **Testing impact**:
  - El nuevo `TestingService` lleva su propio `*.spec.ts` (Vitest backend, ya existente tras LW-432) que asserta: idempotencia del seed, alcance del reset (no toca datos no-`e2e_*`), formato del JWT emitido por `/testing/login`.
  - Las fixtures Playwright se ejercitan al añadir un test mínimo `e2e/tests/seed.spec.ts` que: hace `loginViaApi('coach')`, llama a `resetDatabase()`, vuelve a hacer login y verifica que el coach sigue autenticado. Este test sustituye al smoke como prueba de que el harness completo funciona.
- **Files written**:
  - Nuevos: `src/back/prisma/seed.ts`, `src/back/src/testing/testing.module.ts`, `src/back/src/testing/testing.controller.ts`, `src/back/src/testing/testing.service.ts`, `src/back/src/testing/dto/login-as.dto.ts`, `src/back/src/testing/testing.service.spec.ts`, `e2e/fixtures/users.ts`, `e2e/fixtures/auth.ts`, `e2e/fixtures/reset.ts`, `e2e/global-setup.ts`, `e2e/tests/seed.spec.ts`.
  - Modificados: `src/back/package.json` (campo `prisma.seed`, dep `ts-node`), `src/back/src/app.module.ts` (import condicional de `TestingModule`), `src/back/.env.example`, `.env.example` raíz, `e2e/playwright.config.ts`, `e2e/.env.example`, `e2e/README.md`, `docker-compose.yml`, `doc/Proves_usuari.md` (sección "datos de prueba E2E").
- **Deploy impact**: ninguno en producción. La feature está apagada por defecto (`E2E_TESTING=false`) y el módulo no se monta. La GitHub Action de deploy (`.github/workflows/deploy.yml`) solo necesita confirmar que el secret `ENV_FILE` no incluye `E2E_TESTING=true`.

## Non-goals

- **No se escriben los tests E2E por flujo** (login, rutinas, FriendSession, invitaciones). Eso es **LW-441 / LW-442 / LW-443 / LW-444** y consumirán las fixtures introducidas aquí.
- **No se monta el job de CI** (GitHub Actions con back+front+postgres+E2E_TESTING). Eso es **LW-445**.
- **No se redacta la guía completa de E2E** (Trace Viewer, debugging, conventions, page objects). Eso es **LW-446**. Esta entrega solo añade una sección "Datos de prueba" al `e2e/README.md`.
- **No se introduce un orquestador `webServer`** en `playwright.config.ts` que arranque automáticamente front+back. Sigue siendo manual hasta LW-445.
- **No se cambia el schema Prisma**. Si el seed necesita un `ExerciseCatalog` mínimo, lo crea con `upsert`, no añade entidades nuevas.
- **No se exponen endpoints de testing en producción** bajo ninguna circunstancia. El módulo se monta condicionalmente con doble guarda (`E2E_TESTING=true` AND `NODE_ENV !== 'production'`).
- **No se añaden multi-tenant ni schemas separados de Postgres** para los tests. El reset filtra por convención de nombre (`username` con prefijo `e2e_*`); si el equipo decide migrar a una DB dedicada para E2E, será un cambio futuro.
