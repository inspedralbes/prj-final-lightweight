# Tasks — e2e-seed-data

> **Tracking**: épica **LW-436** · ticket **LW-440** (Preparar datos de prueba y usuarios seed para E2E).
>
> **Fuera de scope** (no tocar en este cambio):
>
> - Tests E2E por flujo (login, rutinas, FriendSession, invitaciones) → **LW-441 / LW-442 / LW-443 / LW-444**.
> - Job de CI con back+front+postgres+E2E_TESTING → **LW-445**.
> - Guía completa de Trace Viewer / page objects / debugging → **LW-446**.
> - Cambios de schema Prisma (no se introducen modelos nuevos).
> - `webServer` automático en `playwright.config.ts` → **LW-445**.

## 1. Backend — Seed determinista

- [x] 1.1 Añadir `ts-node` (^10) y `@types/bcrypt` (si no estuviera ya) a `devDependencies` de `src/back/package.json`. _(Ya estaban en `devDependencies`: `ts-node ^10.9.2`, `@types/bcrypt ^5.0.2`.)_
- [x] 1.2 Añadir el campo `prisma.seed` en `src/back/package.json`: `"prisma": { "seed": "ts-node ./prisma/seed.ts" }`.
- [x] 1.3 Crear `src/back/prisma/seed.ts` con el grafo descrito en `design.md` §"Datos del seed": 5 ejercicios mínimos (`upsert` por `name`), tres usuarios `e2e_*` con `passwordHash = bcrypt('E2eP@ss123!', 10)` (`upsert` por `username`), `ClientProfile` para `e2e_client_linked`, `Routine e2e_routine_basic` (`findFirst+create`), 1 `RoutineExercise`, 1 `RoutineAssignment`, 1 `Invitation` con `code = 'E2E-INVITE-001'` (`upsert` por `code`).
- [x] 1.4 Verificar idempotencia ejecutando manualmente: `cd src/back && npx prisma db seed && npx prisma db seed` — la segunda corrida no debe crear filas adicionales (verificar con SQL contra `users WHERE username LIKE 'e2e_%'`). **Ejecutado contra `lw-postgres` local. Tras 2 runs: `users LIKE 'e2e_%'` = 3, `routines.name='e2e_routine_basic'` = 1, `invitations.code='E2E-INVITE-001'` = 1. Idempotencia confirmada.**

## 2. Backend — Módulo de testing

- [x] 2.1 Crear `src/back/src/testing/testing.module.ts` que importa `PrismaModule`, `JwtModule.register({...})` (reutilizando la config global) y declara `TestingController` y `TestingService`. _(PrismaModule ya es @Global, no hace falta re-importarlo.)_
- [x] 2.2 Crear `src/back/src/testing/dto/login-as.dto.ts` con `LoginAsDto` (`@IsString()` + `@Matches(/^e2e_[a-z_]+$/)`).
- [x] 2.3 Crear `src/back/src/testing/testing.service.ts` con métodos: `seed()` (delega en una función exportada de `prisma/seed.ts` o duplica la lógica), `reset()` (delete cascada por prefijo + seed; medir y devolver `durationMs`), `loginAs(username)` (validar prefijo, `findUnique`, `JwtService.signAsync`).
- [x] 2.4 Crear `src/back/src/testing/testing.controller.ts` con `@Controller('testing')`, `@Post('reset')`, `@Post('seed')`, `@Post('login')` (con `@Body() dto: LoginAsDto`). **No** envolver con `JwtAuthGuard`.
- [x] 2.5 Modificar `src/back/src/app.module.ts` para importar `TestingModule` solo si `process.env.E2E_TESTING === 'true' && process.env.NODE_ENV !== 'production'` (rama condicional en `imports[]`).
- [x] 2.6 Verificar manualmente con `curl`: `curl -X POST http://localhost:3000/testing/reset` (200), `curl -X POST -H "Content-Type: application/json" -d '{"username":"e2e_coach"}' http://localhost:3000/testing/login` (200 con JWT), `curl -X POST -H "Content-Type: application/json" -d '{"username":"admin"}' http://localhost:3000/testing/login` (400). **Resultados: `reset` → 200 (`durationMs: 112`), `login(e2e_coach)` → 200 con JWT verificable contra `/routines/my-routines`, `login(admin)` → 400 con mensaje de regex, `login(e2e_phantom)` → 404. La URL en dev es `:3000/testing/...` directa (el `/api` solo existe vía Nginx en prod). También se añadió `@HttpCode(HttpStatus.OK)` a los tres endpoints para que devuelvan 200 (NestJS POST default es 201).**
- [x] 2.7 Verificar 404 con flag apagado: arrancar el back sin `E2E_TESTING`, `curl -X POST http://localhost:3000/testing/reset` debe devolver 404. **Verificado: sin la variable, los logs de NestJS no muestran `TestingController` mapeado y `curl POST /testing/reset` devuelve 404.**

## 3. Backend — Variables de entorno

- [x] 3.1 Añadir `E2E_TESTING=false` con comentario `# DO NOT SET TO true IN PRODUCTION — enables /testing/* endpoints` en `src/back/.env.example`.
- [x] 3.2 Añadir la misma variable + comentario en el `.env.example` de la raíz del repo.
- [x] 3.3 Documentar en el comentario del workflow `.github/workflows/deploy.yml` (o en `doc/Proves_usuari.md` si no es seguro tocar el workflow ahora) que el secret `ENV_FILE` no debe contener `E2E_TESTING=true`. _(Cubierto en `doc/Proves_usuari.md` §"E2E – datos de prueba" en la task 6.3.)_
- [x] 3.4 Modificar `docker-compose.yml` (dev) para que el servicio `lw-backend` lea `E2E_TESTING: ${E2E_TESTING:-false}` desde `environment:`. **NO tocar `docker-compose.prod.yml`.**

## 4. E2E workspace — Fixtures

- [x] 4.1 Crear `e2e/fixtures/users.ts` exportando `e2eUsers` con tres entradas tipadas (`coach`, `clientLinked`, `clientUnlinked`) — cada una con `username`, `password = 'E2eP@ss123!'`, `role`.
- [x] 4.2 Crear `e2e/fixtures/auth.ts` con `loginViaApi(page, user)`: hace `fetch(API + '/testing/login', {body: {username}})`, lee la respuesta y ejecuta `page.goto('/')` + `page.evaluate(...)` para escribir `token`, `userRole`, `username`, `userId`, `coachId` en `localStorage` (mismas keys que usa `AuthContext`).
- [x] 4.3 Crear `e2e/fixtures/reset.ts` con `resetDatabase()`: `fetch(API + '/testing/reset', {method: 'POST'})` y throws si !ok (mensaje claro distinguiendo back-no-arrancado vs 404=flag-apagado).
- [x] 4.4 Crear `e2e/fixtures/index.ts` que define el `test` extendido con `loginAs` (returns `(role) => Page authenticada`) y `freshDb` (`{ auto: true }` que llama a `resetDatabase()`). Re-exportar `expect` desde `@playwright/test`.
- [x] 4.5 Crear `e2e/global-setup.ts` que hace un `fetch(API + '/testing/reset')` y throws con mensaje claro si falla. Detectar 404 vs error de red para distinguir "back no arrancado" de "flag apagado". _(Implementado en `reset.ts`; `global-setup.ts` solo invoca `resetDatabase()`.)_
- [x] 4.6 Modificar `e2e/playwright.config.ts` para añadir `globalSetup: require.resolve('./global-setup')`.
- [x] 4.7 Corregir `PLAYWRIGHT_API_URL` en `e2e/.env.example`: el back en dev no tiene `setGlobalPrefix('api')` — el `/api` solo existe vía Nginx en prod. Cambiado a `http://localhost:3000` y añadido aviso de `E2E_TESTING=true`. También añadido `fixtures/**/*.ts` y `global-setup.ts` al `tsconfig.json` `include`.

## 5. E2E workspace — Test mínimo de validación

- [x] 5.1 Crear `e2e/tests/seed.spec.ts` con un `test('login → reset → login again works')` que: usa la fixture `loginAs('coach')`, luego llama a `resetDatabase()` y vuelve a usar `loginAs('coach')`, comprueba que `localStorage` contiene token + role tras cada login.
- [x] 5.2 Mantener el smoke existente (`e2e/tests/smoke.spec.ts`) intacto. **No borrar.** Sigue siendo el "el front carga" test.

## 6. Documentación

- [x] 6.1 Extender `e2e/README.md` con la nueva sección "Datos de prueba" según `spec.md` §"README operativo extendido": cómo arrancar el back con flag, cómo correr el seed, listado de usuarios, ejemplo de `import { test, expect } from '../fixtures'`, cómo hacer `curl` al reset manualmente.
- [x] 6.2 Mantener la nota explícita "La guía completa (Trace Viewer, convenciones, debugging) llegará con LW-446" en el mismo `README.md`.
- [x] 6.3 Añadir a `doc/Proves_usuari.md` una nueva sección "E2E – datos de prueba" con los pasos manuales: arrancar back con flag, correr seed, abrir Adminer y verificar las tres filas en `users`, hacer `curl POST /testing/login` con `e2e_coach` y comprobar que devuelve un JWT, además del fail-closed `NODE_ENV=production`.

## 7. Tests / Verification

- [x] 7.1 Crear `src/back/src/testing/testing.service.spec.ts` (Vitest) cubriendo: `loginAs('admin')` → `BadRequestException`; `loginAs('e2e_phantom')` → `NotFoundException`; `loginAs('e2e_coach')` con un user mockeado → devuelve `{access_token, user}` con el role correcto y un payload firmado por `JwtService`; `seed()` llamado dos veces no produce side-effects observables (mock de `PrismaService` con counters); `reset()` invocado en una DB mockeada con un user `coach_real` y un user `e2e_test` solo borra el segundo. **8 tests cubriendo loginAs, seed (idempotencia), reset (filtro por prefijo + skip cuando vacío + DELETE acotado).**
- [x] 7.2 Verificar localmente con un único comando: `cd src/back && npm test -- testing` debe terminar verde. **`Tests 8 passed (8)` ✓.**
- [x] 7.3 Verificar `npm run lint` limpio en `src/back`. **Los archivos de LW-440 (seed.ts, testing/\* y app.module.ts) no añaden lint errors. Pre-existing baseline: 161 errors / 33 warnings en archivos no tocados (routines, session, chat, events, etc.) — fuera de scope.**
- [x] 7.4 Verificar `npm run build` (NestJS) limpio en `src/back`. **Confirmado: 0 errores nuevos; los 2 errores TS2322 en `src/session/session.service.ts:62,122` ya estaban en main antes de LW-440 (verificado con `git stash --include-untracked`). Fuera de scope.**
- [x] 7.5 Verificar `npx prisma validate` limpio en `src/back`. **`The schema at src/back/prisma/schema.prisma is valid 🚀`.**
- [x] 7.6 Smoke E2E: arrancar back con `E2E_TESTING=true npm run start:dev`, arrancar front, ejecutar `cd e2e && npm run test:e2e:browser` y confirmar `2 passed` (smoke + seed). **Ejecutado contra back compilado (`node dist/main.js`) + front Vite. Resultado: `2 passed (1.5s)` — smoke (632ms) + seed (784ms).**
- [x] 7.7 Test manual de fail-closed: arrancar el back con `NODE_ENV=production E2E_TESTING=true npm run start:prod` (sobre el build) y confirmar `curl -X POST http://localhost:3000/testing/reset` devuelve 404. **Verificado: con `NODE_ENV=production E2E_TESTING=true node dist/main.js`, los logs no incluyen `TestingController` y `curl POST /testing/reset` devuelve 404. La doble guarda (`E2E_TESTING && NODE_ENV !== 'production'`) funciona correctamente.**
- [x] 7.8 Manual QA pass: ejecutar la nueva sección de `doc/Proves_usuari.md` "E2E – datos de prueba" y marcar OK. **Checklist completo ejecutado en local 2026-05-05: P1 `TestingController` + 3 routes mapeados ✓ · P2 seed inicial: 3 users + rutina + invitación ✓ · P3 re-seed con IDs idénticos (33/34/35 antes y después) ✓ · P4 `login(e2e_coach)` → 200 con JWT (`{userId:33, role:"COACH", iat, exp}`) ✓ · P5 `login(admin)` → 400 con `username must match /^e2e_[a-z_]+$/` ✓ · P6 `reset` → 200, `durationMs:133` (≪ 2000) ✓ · P7 back sin flag → 404 + sin `/testing` en logs ✓ · P8 `NODE_ENV=production E2E_TESTING=true` → 404 (doble guarda) ✓.**

## 8. Cierre

- [x] 8.1 Verificar que `openspec validate e2e-seed-data --strict` pasa sin warnings. **`Change 'e2e-seed-data' is valid` ✓.**
- [x] 8.2 Comprobar que **LW-441 / LW-442 / LW-443 / LW-444** quedan desbloqueadas (las fixtures `loginAs` y `freshDb` están disponibles para que sus respectivos cambios las consuman). **`e2e/fixtures/index.ts` exporta `test`, `expect`, `loginAs`, `freshDb`, `e2eUsers`, `resetDatabase`, `loginViaApi` — listo para `import { test, expect } from '../fixtures'`.**
