# Spec: Testing E2E

## Propòsit

Proporcionar un workspace de testing end-to-end aïllat (`e2e/`) a l'arrel del repositori usant Playwright, separat dels arbres de codi del frontend i el backend. El workspace suporta execució local i en CI reproduïble, inclou un smoke test mínim per verificar el pipeline complet navegador–frontend, i ha estat netejat de qualsevol scaffolding anterior de Cypress.

---

## Requisits

### Requisit: Workspace E2E aïllat

El sistema HA DE proporcionar un workspace `e2e/` a l'arrel del repositori que allotgi la suite completa de tests end-to-end amb Playwright, separada de `src/front/` i `src/back/`. El workspace HA DE declarar el seu propi `package.json` amb `"private": true` i `@playwright/test` com a devDependency, i HA DE poder instal·lar-se de forma independent de la resta del monorepo.

#### Escenari: Estructura del workspace

- **DONAT** un desenvolupador que clona el repositori després d'aquest canvi
- **QUAN** executa `ls e2e/`
- **ALESHORES** veu, com a mínim, els arxius: `package.json`, `playwright.config.ts`, `tsconfig.json`, `README.md`, `.env.example` i el directori `tests/`
- **I** `e2e/package.json` declara `"private": true` i `@playwright/test` com a devDependency

#### Escenari: Instal·lació independent

- **DONAT** el workspace `e2e/` acabat de clonar i sense instal·lar
- **QUAN** el desenvolupador executa `cd e2e && npm install && npx playwright install chromium`
- **ALESHORES** la instal·lació es completa sense errors
- **I** `e2e/node_modules/@playwright/test/package.json` existeix
- **I** Chromium queda instal·lat a la caché local de Playwright

#### Escenari: Aïllament del frontend

- **DONAT** el workspace `e2e/` instal·lat
- **QUAN** s'executa `cd src/front && npm run lint && npm run build`
- **ALESHORES** ambdues ordres acaben amb codi 0
- **I** el bundle de producció del frontend no inclou cap referència a `@playwright/test` ni a arxius de `e2e/`

---

### Requisit: Configuració de Playwright reproduïble

El sistema HA DE definir `playwright.config.ts` perquè la suite es comporti de forma consistent entre l'entorn de desenvolupament local i CI. La configuració HA D'exposar `baseURL` via la variable d'entorn `PLAYWRIGHT_BASE_URL` (amb valor per defecte `http://localhost:5173`), HA D'aplicar 2 reintents quan `process.env.CI` estigui definit i 0 reintents en cas contrari, i HA DE produir artefactes de traça, captura de pantalla i vídeo en cas de falla.

#### Escenari: baseURL configurable per entorn (per defecte)

- **DONAT** la variable d'entorn `PLAYWRIGHT_BASE_URL` no definida
- **QUAN** s'executa `npm run test:e2e:browser`
- **ALESHORES** Playwright usa `http://localhost:5173` com a `baseURL` del frontend

#### Escenari: baseURL configurable per entorn (override)

- **DONAT** la variable `PLAYWRIGHT_BASE_URL=https://staging.lightweight.daw.inspedralbes.cat` definida
- **QUAN** s'executa `npm run test:e2e:browser`
- **ALESHORES** els `page.goto('/')` es resolen contra aquella URL

#### Escenari: Reintents només en CI

- **DONAT** la variable d'entorn `CI` no definida (entorn local)
- **QUAN** un test falla
- **ALESHORES** Playwright **no** el reintenta i reporta la falla immediatament

- **DONAT** la variable d'entorn `CI=true` definida
- **QUAN** un test falla
- **ALESHORES** Playwright el reintenta fins a 2 vegades abans de marcar-lo com a fallat

#### Escenari: Artefactes de depuració en falla

- **DONAT** un test que falla
- **QUAN** acaba l'execució
- **ALESHORES** es genera un arxiu `trace.zip` a `e2e/test-results/<test-name>/`
- **I** es genera una captura de pantalla del moment de la falla
- **I** es genera un vídeo de l'execució
- **I** `npx playwright show-report` obre un report HTML amb tots els artefactes vinculats

---

### Requisit: Smoke test executable

El sistema HA D'incloure exactament un smoke test a `e2e/tests/smoke.spec.ts` que verifiqui el pipeline complet (Playwright → navegador → frontend → DOM) sense dependre del seed de la base de dades ni de l'autenticació. Aquest és l'únic test introduït per aquest canvi; els tests per flux viuen en canvis posteriors.

#### Escenari: Smoke passa amb el frontend arrencat

- **DONAT** el frontend arrencat a `http://localhost:5173`
- **QUAN** s'executa `cd e2e && npm run test:e2e:browser`
- **ALESHORES** l'ordre acaba amb codi 0
- **I** la sortida indica `1 passed`

#### Escenari: Smoke falla amb el frontend aturat

- **DONAT** el frontend **no** arrencat
- **QUAN** s'executa `cd e2e && npm run test:e2e:browser`
- **ALESHORES** l'ordre acaba amb codi diferent de 0
- **I** el missatge d'error indica que el navegador no ha pogut connectar al `baseURL`
- **I** es genera el `playwright-report/` amb la traça de la falla

---

### Requisit: README operatiu mínim

El sistema HA D'incloure un `e2e/README.md` mínim que documenti únicament com instal·lar les dependències i com executar el smoke test localment. La documentació completa (ús del Trace Viewer, convencions, guia de depuració, patrons de fixtures) queda **explícitament fora de l'abast** d'aquest canvi i és responsabilitat de LW-446.

#### Escenari: README cobreix instal·lació i execució del smoke

- **DONAT** `e2e/README.md` a l'arrel del workspace
- **QUAN** un desenvolupador el llegeix
- **ALESHORES** troba com a mínim: com instal·lar (`npm install` + `npx playwright install chromium`) i com executar el smoke (`npm run test:e2e:browser` amb el frontend arrencat a `:5173`)

#### Escenari: README delega la guia completa a LW-446

- **DONAT** `e2e/README.md` a l'arrel del workspace
- **QUAN** un desenvolupador el llegeix
- **ALESHORES** troba una nota explícita indicant que la guia completa d'E2E (Trace Viewer, convencions, depuració) arribarà amb LW-446
- **I** **NO** conté seccions detallades sobre Trace Viewer ni convencions d'organització (això pertany a LW-446)

---

### Requisit: Neteja de l'scaffolding anterior

El sistema NO HA DE contenir cap residu de l'scaffolding anterior de Cypress: el directori `src/front/cypress/` i l'arxiu `src/front/.env.cypress.example` HAN DE ser eliminats, i cap arxiu sota control de versions HA DE referenciar `cypress`.

#### Escenari: Sense restes de Cypress

- **DONAT** el repositori en el seu estat final després d'aquest canvi
- **QUAN** s'executa `grep -ri "cypress" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" --include="*.yml" --exclude-dir=node_modules .`
- **ALESHORES** l'ordre retorna zero coincidències
- **I** la carpeta `src/front/cypress/` no existeix
- **I** `src/front/.env.cypress.example` no existeix

---

### Requisit: Seed determinista d'usuaris E2E

El sistema HA DE proporcionar un script de seed determinista a `src/back/prisma/seed.ts`, registrat sota el camp `prisma.seed` de `src/back/package.json` (`ts-node ./prisma/seed.ts`), que creï un conjunt fix de tres usuaris de test E2E — `e2e_coach` (UserRole.COACH), `e2e_client_linked` (UserRole.CLIENT, amb `coachId` apuntant a `e2e_coach`) i `e2e_client_unlinked` (UserRole.CLIENT, `coachId = null`) — juntament amb una `Routine` anomenada `e2e_routine_basic` propietat del coach, un `RoutineExercise`, un `RoutineAssignment` vinculant la rutina a `e2e_client_linked`, i una `Invitation` (`code = 'E2E-INVITE-001'`, `status = 'PENDING'`, `coachId = e2e_coach.id`, `targetClientId = e2e_client_unlinked.id`). El seed HA DE ser idempotent (basat en `upsert` per a camps únics, `findFirst+create` per a `Routine`) i re-executable sense errors.

#### Escenari: Seed inicial sobre BD sense dades `e2e_*`

- **DONAT** una base de dades PostgreSQL sense files amb `username` que comenci per `e2e_`
- **QUAN** un desenvolupador executa `cd src/back && npx prisma db seed`
- **ALESHORES** el script acaba amb codi 0
- **I** la taula `users` conté exactament tres usuaris amb `username` `e2e_coach`, `e2e_client_linked`, `e2e_client_unlinked`
- **I** `e2e_client_linked.coach_id` és igual a `e2e_coach.id`
- **I** existeix una `Routine` amb `name = 'e2e_routine_basic'` i `coach_id = e2e_coach.id` amb almenys un `RoutineExercise` i un `RoutineAssignment` apuntant a `e2e_client_linked`
- **I** existeix una `Invitation` amb `code = 'E2E-INVITE-001'`, `status = 'PENDING'`, `coach_id = e2e_coach.id`, `target_client_id = e2e_client_unlinked.id`

#### Escenari: Seed idempotent

- **DONAT** un seed ja aplicat correctament
- **QUAN** el desenvolupador executa `npx prisma db seed` per segona vegada
- **ALESHORES** el script acaba amb codi 0
- **I** no es creen usuaris addicionals — `SELECT COUNT(*) FROM users WHERE username LIKE 'e2e_%'` retorna exactament 3
- **I** els `id` dels tres usuaris `e2e_*` són els mateixos que després de la primera execució
- **I** `e2e_routine_basic` segueix sent única (no es crea una segona còpia)

#### Escenari: Seed assegura `ExerciseCatalog` mínim

- **DONAT** una base de dades on `ExerciseCatalog` està buit
- **QUAN** s'executa el seed
- **ALESHORES** el script crea (via `upsert`) almenys 5 exercicis fixos a `ExerciseCatalog` (Push-up, Pull-up, Squat, Bench Press, Deadlift)
- **I** el `RoutineExercise` de `e2e_routine_basic` referencia un d'aquells exercicis

---

### Requisit: Mòdul de testing del backend carregat condicionalment

El sistema HA DE lliurar un mòdul NestJS `TestingModule` a `src/back/src/testing/` que s'importi a `AppModule` si i només si `process.env.E2E_TESTING === 'true'` I `process.env.NODE_ENV !== 'production'`. El mòdul HA D'exposar tres endpoints HTTP sota `/api/testing/*` i NO HA DE ser accessible quan qualsevol de les condicions falli, en aquell cas els endpoints HAN DE respondre amb HTTP 404. El mòdul NO HA DE ser embolcallat per `JwtAuthGuard` — és intencionalment obert mentre està actiu i controlat únicament per la variable d'entorn.

#### Escenari: Mòdul actiu en dev amb flag

- **DONAT** el backend arrencat amb `E2E_TESTING=true` i `NODE_ENV=development`
- **QUAN** es fa `POST http://localhost:3000/api/testing/reset`
- **ALESHORES** la resposta té HTTP status 200
- **I** el body és JSON amb la forma `{ reset: true, seeded: { users: [...], routines: [...], invitations: number }, durationMs: number }`

#### Escenari: Mòdul inactiu sense flag

- **DONAT** el backend arrencat amb `E2E_TESTING` no definida (o `false`)
- **QUAN** es fa `POST http://localhost:3000/api/testing/reset`
- **ALESHORES** la resposta té HTTP status 404
- **I** el body és la resposta NestJS per defecte (`Cannot POST /api/testing/reset`)

#### Escenari: Mòdul inactiu en producció fins i tot amb flag

- **DONAT** el backend arrencat amb `E2E_TESTING=true` i `NODE_ENV=production`
- **QUAN** es fa `POST http://localhost:3000/api/testing/reset`
- **ALESHORES** la resposta té HTTP status 404
- **I** els logs del servidor NO contenen cap entrada de `TestingController` (perquè el mòdul no s'ha carregat)

---

### Requisit: Endpoint de reset E2E

El sistema HA D'exposar `POST /api/testing/reset` (quan el mòdul de testing és actiu) que elimini cada fila de `LiveSession`, `LiveParticipant`, `WorkoutEvent`, `ChatMessage`, `Invitation`, `Routine`, `RoutineExercise`, `RoutineAssignment`, `ClientProfile`, `P2PChatMessage` les claus foranies de les quals arriben a un `User` el `username` del qual comenci per `e2e_`, i després elimini aquelles files de `User`. Finalment torna a aplicar el seed determinista. L'endpoint NO HA D'eliminar cap `User` el username del qual no coincideixi amb `^e2e_`. L'endpoint HA DE completar-se en menys de 2000 ms en un PostgreSQL local amb menys de 1000 files per taula. **L'ordre d'eliminació explícita per a files d'àmbit `LiveSession` HA DE ser: `WorkoutEvent` → `ChatMessage` (nivell de sessió) → `LiveParticipant` → `LiveSession`**, per respectar les restriccions de clau forana abans d'eliminar les files de `User`.

#### Escenari: Reset neteja LiveSessions d'usuaris e2e

- **DONAT** la BD conté un `LiveSession` creat durant un test de co-op amb `hostId = e2e_coach.id`
- **I** la BD conté `LiveParticipant`, `WorkoutEvent` i `ChatMessage` (de sessió) associats a aquella `LiveSession`
- **QUAN** es fa `POST /api/testing/reset`
- **ALESHORES** la resposta és HTTP 200
- **I** `SELECT COUNT(*) FROM live_sessions WHERE host_id = (SELECT id FROM users WHERE username = 'e2e_coach')` retorna 0
- **I** `SELECT COUNT(*) FROM live_participants WHERE session_id IN (...)` retorna 0
- **I** els tres usuaris `e2e_*` han estat recreats amb les seves relacions base

#### Escenari: Reset no toca usuaris reals

- **DONAT** la BD conté un usuari real `coach_marina` (sense prefix `e2e_`) amb les seves rutines, assignacions i missatges
- **I** la BD conté els tres usuaris `e2e_*` sembrats
- **QUAN** es fa `POST /api/testing/reset`
- **ALESHORES** la resposta és HTTP 200
- **I** `SELECT COUNT(*) FROM users WHERE username = 'coach_marina'` segueix retornant 1
- **I** les rutines, assignacions i missatges de `coach_marina` segueixen presents (files no eliminades)
- **I** `SELECT COUNT(*) FROM users WHERE username LIKE 'e2e_%'` retorna 3 (els va recrear el seed)

#### Escenari: Reset neteja dades òrfenes `e2e_*`

- **DONAT** la BD té els tres usuaris sembrats més un quart usuari `e2e_extra` creat manualment per un test anterior que no va netejar
- **QUAN** es fa `POST /api/testing/reset`
- **ALESHORES** `SELECT COUNT(*) FROM users WHERE username LIKE 'e2e_%'` retorna exactament 3
- **I** `e2e_extra` ja no existeix

#### Escenari: Reset dins del pressupost de temps

- **DONAT** una BD local amb <1000 files per taula
- **QUAN** es fa `POST /api/testing/reset` i es mesura el camp `durationMs` de la resposta
- **ALESHORES** `durationMs < 2000`

---

### Requisit: Endpoint de seed sense reset

El sistema HA D'exposar `POST /api/testing/seed` (quan el mòdul de testing és actiu) que executi només la fase de seed (sense eliminar res) i HA DE ser segur de cridar repetidament gràcies a la idempotència del seed.

#### Escenari: Seed sense reset és idempotent

- **DONAT** els tres usuaris `e2e_*` ja creats amb les seves relacions
- **QUAN** es fa `POST /api/testing/seed` dues vegades seguides
- **ALESHORES** ambdues respostes són HTTP 200
- **I** els IDs dels tres usuaris no han canviat entre la primera i la segona crida
- **I** la taula `users` no ha crescut

#### Escenari: Seed restaura entitats eliminades manualment

- **DONAT** els tres usuaris `e2e_*` existeixen però un dev ha eliminat la `e2e_routine_basic` manualment des d'Adminer
- **QUAN** es fa `POST /api/testing/seed`
- **ALESHORES** la resposta és HTTP 200
- **I** `SELECT COUNT(*) FROM routines WHERE name = 'e2e_routine_basic'` torna a retornar 1
- **I** els IDs dels tres usuaris segueixen sent els mateixos (no s'han recreat)

---

### Requisit: Endpoint de login as

El sistema HA D'exposar `POST /api/testing/login` (quan el mòdul de testing és actiu) acceptant un body JSON validat per `LoginAsDto` (`username: string` que coincideixi amb `^e2e_[a-z_]+$`). L'endpoint HA DE retornar la mateixa forma de resposta que `POST /api/auth/login` (`{ access_token, user: { id, username, role, coachId } }`) per a qualsevol usuari el username del qual coincideixi amb la regex, signant un JWT via `JwtService` amb payload `{ userId: user.id, role: user.role }` (la mateixa forma que produeix `AuthService.login()`, perquè l'existent `JwtStrategy.validate()` l'accepti sense canvis). L'endpoint HA DE rebutjar qualsevol username que no coincideixi amb `^e2e_*` amb HTTP 400, i HA DE retornar HTTP 404 si l'usuari coincident no existeix.

#### Escenari: Login as e2e_coach

- **DONAT** el seed aplicat i el mòdul de testing actiu
- **QUAN** es fa `POST /api/testing/login` amb body `{ "username": "e2e_coach" }`
- **ALESHORES** la resposta és HTTP 200
- **I** el body conté `access_token` (string JWT no buit) i `user.role === 'COACH'`
- **I** aquell mateix `access_token` autentica correctament una crida a un endpoint protegit per `JwtAuthGuard` (p. ex. `GET /api/routines/my-routines` → HTTP 200), perquè el seu payload `{ userId, role }` quadra amb el que espera `JwtStrategy.validate()`

#### Escenari: Login as username no permès

- **DONAT** el mòdul de testing actiu
- **QUAN** es fa `POST /api/testing/login` amb body `{ "username": "admin_real" }`
- **ALESHORES** la resposta és HTTP 400
- **I** el missatge inclou `"username must match /^e2e_[a-z_]+$/"`
- **I** la BD no es consulta (el rebuig ocorre al `class-validator`)

#### Escenari: Login as usuari inexistent

- **DONAT** el mòdul de testing actiu i un seed que no conté `e2e_phantom`
- **QUAN** es fa `POST /api/testing/login` amb body `{ "username": "e2e_phantom" }`
- **ALESHORES** la resposta és HTTP 404
- **I** el missatge inclou `"User e2e_phantom not found"`

---

### Requisit: Fixtures Playwright multi-usuari

El workspace E2E HA DE proporcionar fixtures Playwright reutilitzables a `e2e/fixtures/` exportant com a mínim: un mapa `e2eUsers` tipat (amb `e2eCoach`, `e2eClientLinked`, `e2eClientUnlinked`, cadascun amb `username`, `password`, `role`); un helper `loginViaApi(page, user)` que cridi `POST /api/testing/login`, emmagatzemi el `access_token` retornat i la informació de l'usuari al `localStorage` del navegador (coincidint amb les claus usades per `AuthContext`: `token`, `userRole`, `username`, `userId`, `coachId`), i retorni un cop s'hagi establert el `localStorage`; un helper `resetDatabase()` que cridi `POST /api/testing/reset`; i un `test` Playwright estès (`e2e/fixtures/index.ts`) que exposi una fixture `loginAs` i una fixture auto-executada `freshDb`. El barrel de fixtures HA DE re-exportar `expect` de `@playwright/test` perquè els tests puguin fer `import { test, expect } from '../fixtures'`.

#### Escenari: Fixture `loginAs('coach')` deixa sessió activa a la pàgina

- **DONAT** el backend amb `E2E_TESTING=true` arrencat a `:3000`, el frontend a `:5173`, i el seed aplicat
- **QUAN** un test E2E crida `await loginAs('coach')` i després `await page.goto('/dashboard')`
- **ALESHORES** la pàgina `/dashboard` carrega sense redirigir a `/login`
- **I** `localStorage.getItem('userRole') === 'COACH'`
- **I** `localStorage.getItem('username') === 'e2e_coach'`

#### Escenari: Fixture `freshDb` reseteja abans de cada test

- **DONAT** dos tests E2E `t1` i `t2` que comparteixen arxiu
- **I** `t1` crea un usuari addicional `e2e_temp` via l'endpoint `/api/testing/seed` amb un payload estès (hipotètic) — o simplement el crea des de la fixture
- **QUAN** `t2` comença a executar-se
- **ALESHORES** `e2e_temp` ja no existeix (`POST /api/testing/login {username: "e2e_temp"}` retorna 404)
- **I** els tres usuaris `e2e_*` sembrats sí existeixen

#### Escenari: El test pot optar a no resetejar

- **DONAT** un test que necessita compartir estat amb un altre (`describe.serial`)
- **QUAN** l'arxiu declara `test.use({ freshDb: false })`
- **ALESHORES** la fixture `freshDb` no s'executa entre tests del bloc i les dades persisteixen entre ells

---

### Requisit: Global setup que verifica el harness

El workspace E2E HA DE definir `e2e/global-setup.ts`, referenciat des de `playwright.config.ts` via `globalSetup`, que executi un únic `POST` a `${PLAYWRIGHT_API_URL ?? 'http://localhost:3000/api'}/testing/reset` abans que s'executi la suite. Si la petició falla (error de xarxa o resposta no 200), el setup HA DE llançar amb un missatge clar i accionable que nomeni la peça que falta (backend no en marxa, flag `E2E_TESTING` no establert, o resposta d'API inesperada).

#### Escenari: Global setup OK

- **DONAT** el backend arrencat amb `E2E_TESTING=true`
- **QUAN** Playwright arrenca la suite
- **ALESHORES** `global-setup.ts` rep HTTP 200 de `/api/testing/reset`
- **I** la suite continua amb els tests

#### Escenari: Global setup falla ràpid si el backend no respon

- **DONAT** el backend **no** arrencat
- **QUAN** Playwright intenta arrencar la suite
- **ALESHORES** l'execució acaba abans d'executar cap test
- **I** el missatge d'error conté `"Backend not reachable at http://localhost:3000/api"` o equivalent clar

#### Escenari: Global setup falla si el flag està apagat

- **DONAT** el backend arrencat però sense `E2E_TESTING=true`
- **QUAN** Playwright intenta arrencar la suite
- **ALESHORES** l'execució acaba amb error
- **I** el missatge inclou `"E2E_TESTING flag must be set to 'true' on the backend"` o equivalent que apunti a la causa real (404 a `/api/testing/reset`)

---

### Requisit: Variable d'entorn `E2E_TESTING` documentada i `fail-closed` en producció

El repositori HA DE documentar la variable d'entorn `E2E_TESTING` a `.env.example` (arrel), `src/back/.env.example`, la nota de plantilla `ENV_FILE` de GitHub Actions, i el README de `e2e/.env.example`. Cada ocurrència HA D'incloure un comentari en línia marcant-la com a **mai habilitar en producció**. El backend HA DE refusar carregar `TestingModule` quan `process.env.NODE_ENV === 'production'`, fins i tot si es força `E2E_TESTING=true`.

---

### Requisit: El badge d'invitacions pendents exposa data-testid per a la selecció E2E

El component Layout HA DE renderitzar l'element del badge d'invitacions pendents amb `data-testid="pending-invites-badge"` sempre que el comptador del badge sigui superior a zero, perquè els tests Playwright el puguin localitzar de forma fiable sense dependre de selectors CSS fràgils o de text.

#### Escenari: L'element del badge és consultable per data-testid quan el comptador és > 0

- **DONAT** el frontend s'està executant i `e2e_client_unlinked` ha iniciat sessió
- **I** hi ha almenys una invitació `PENDING` per a aquest client
- **QUAN** Playwright consulta `page.locator('[data-testid="pending-invites-badge"]')`
- **ALESHORES** es troba exactament un element
- **I** el seu `textContent` és igual a la representació en cadena del comptador de pendents (p. ex. `"1"`)

#### Escenari: L'element del badge és absent quan el comptador és 0

- **DONAT** `e2e_client_linked` ha iniciat sessió (ja té un coach, cap invitació pendent)
- **QUAN** Playwright consulta `page.locator('[data-testid="pending-invites-badge"]')`
- **ALESHORES** el comptador d'elements és 0 (element no al DOM o ocult)

#### Escenari: Testabilitat — l'atribut és present al HTML renderitzat

- **DONAT** la compilació del frontend finalitza correctament (`npm run build` a `src/front/`)
- **QUAN** un desenvolupador inspecciona el nav de Layout a DevTools amb una invitació pendent present
- **ALESHORES** el `<span>` del badge (o element equivalent) té `data-testid="pending-invites-badge"` als seus atributs

---

### Requisit: Suite E2E executable en CI sense intervenció manual

El sistema HA DE suportar l'execució de la suite E2E completa en un entorn de runner de GitHub Actions on: el frontend es serveix via Vite dev/preview a `http://localhost:5173`; el backend corre a `http://localhost:3000` amb `E2E_TESTING=true` i `NODE_ENV=test`; PostgreSQL 17 està disponible a `localhost:5432`; i no hi ha secrets de producció presents. `playwright.config.ts` i `e2e/global-setup.ts` ja satisfan aquest requisit llegint `PLAYWRIGHT_BASE_URL` i `PLAYWRIGHT_API_URL` des de variables d'entorn — aquest requisit converteix l'execució en CI en un criteri d'acceptació formal.

#### Escenari: Suite completa passa en l'entorn de CI

- **DONAT** l'stack efímer descrit (service container de PostgreSQL, backend natiu, Vite dev)
- **I** `PLAYWRIGHT_BASE_URL=http://localhost:5173` i `PLAYWRIGHT_API_URL=http://localhost:3000/api` definits
- **I** `E2E_TESTING=true` definit en el procés del backend
- **QUAN** s'executa `cd e2e && npx playwright test` al runner
- **ALESHORES** l'ordre acaba amb codi 0
- **I** tots els tests existents a `e2e/tests/` passen (inclosos els multi-usuari que usen la fixture `twoUsers`)

#### Escenari: Global setup verifica el harness abans dels tests en CI

- **DONAT** el backend arrencat al runner amb `E2E_TESTING=true`
- **QUAN** Playwright inicialitza la suite (executa `global-setup.ts`)
- **ALESHORES** `global-setup.ts` rep HTTP 200 de `POST /api/testing/reset`
- **I** la suite continua amb els tests normalment

#### Escenari: Reintents actius en CI — test inestable no bloqueja immediatament

- **DONAT** `CI=true` definit a l'entorn del runner
- **I** un test que falla en la seva primera execució per timing
- **QUAN** Playwright el reintenta (fins a 2 vegades segons `playwright.config.ts`)
- **ALESHORES** si passa en el segon o tercer intent, el test es reporta com a `flaky` (ha passat amb retry)
- **I** el job acaba amb codi 0 (flaky ≠ failure a Playwright per defecte)
- **I** si falla les 3 vegades, el test es reporta com a `failed` i el job acaba amb codi diferent de 0

---

### Requisit: Endpoint helper E2E — inject reset token

El backend HA D'exposar `POST /testing/inject-reset-token` quan `E2E_TESTING=true`. L'endpoint HA D'acceptar `{ email: string }`, invalidar qualsevol token no usat existent per a aquell usuari, crear un nou `PasswordResetToken` amb un valor de token en brut determinista, i retornar `{ rawToken: string }`. Aquest endpoint NO HA DE ser accessible quan `E2E_TESTING` és false.

#### Escenari: Retorna el token en brut per a un usuari conegut

- **DONAT** `E2E_TESTING=true` i un usuari sembrat amb `email: 'e2e_coach@lightweight.test'`
- **QUAN** es crida `POST /testing/inject-reset-token` amb `{ email: 'e2e_coach@lightweight.test' }`
- **ALESHORES** la resposta és `200 OK` amb body `{ rawToken: '<cadena hex>' }`
- **I** existeix una fila `PasswordResetToken` amb `token = sha256(rawToken)`, `used = false`, `expiresAt` ~30 min des d'ara

#### Escenari: Invalida el token anterior abans d'inserir

- **DONAT** l'usuari ja té un `PasswordResetToken` no usat
- **QUAN** es crida `POST /testing/inject-reset-token` de nou per al mateix email
- **ALESHORES** el token anterior es marca com `used = true`
- **I** només el token injectat novament és vàlid

#### Escenari: Endpoint bloquejat quan E2E_TESTING no està establert

- **DONAT** el backend s'ha arrencat sense `E2E_TESTING=true`
- **QUAN** es crida `POST /testing/inject-reset-token`
- **ALESHORES** la resposta és `404 Not Found`

---

### Requisit: Fixture E2E — els usuaris inclouen el camp email

La fixture `e2eUsers` a `e2e/fixtures/users.ts` HA D'incloure un camp `email` per a cada usuari. L'endpoint de seed `/testing/reset` HA DE poblar la columna `email` usant aquells valors.

#### Escenari: L'email de e2e_coach és determinista

- **DONAT** la suite E2E executa `POST /testing/reset`
- **QUAN** es crida `prismaMock.user.findUnique({ where: { email: 'e2e_coach@lightweight.test' } })`
- **ALESHORES** l'usuari es troba

#### Escenari: El tipus E2eUser inclou email

- **DONAT** el tipus TypeScript `E2eUser`
- **QUAN** s'inspecciona el tipus
- **ALESHORES** té les propietats `username: string`, `password: string`, `role: 'COACH' | 'CLIENT'`, `email: string`

---

### Requisit: Test E2E happy-path — flux complet forgot-password → reset-password → login

Un test Playwright HA DE conduir el flux complet del navegador: navegar a `/forgot-password`, enviar l'email, obtenir el token via l'endpoint d'injecció, navegar a `/reset-password?token=...`, establir una nova contrasenya, verificar la redirecció a `/login`, i iniciar sessió correctament amb la nova contrasenya.

#### Escenari: El visitant completa el flux complet de restabliment de contrasenya

- **DONAT** la BD sembrada amb `e2e_coach` tenint email `e2e_coach@lightweight.test`
- **QUAN** el visitant navega a `/forgot-password`, introdueix `e2e_coach@lightweight.test` i envia
- **ALESHORES** un missatge d'èxit genèric o toast és visible (la UI no revela si l'email existeix)
- **I** `POST /testing/inject-reset-token` retorna un `rawToken`
- **QUAN** el visitant navega a `/reset-password?token=<rawToken>` i introdueix `NewE2ePass123!` en tots dos camps de contrasenya i envia
- **ALESHORES** es mostra un toast d'èxit i la pàgina redirigeix a `/login`
- **QUAN** el visitant inicia sessió amb `e2e_coach` i `NewE2ePass123!`
- **ALESHORES** l'inici de sessió té èxit i el dashboard del coach és visible

#### Escenari: El botó d'enviament es deshabilita mentre la petició és en vol

- **DONAT** el visitant és a `/forgot-password`
- **QUAN** el visitant envia el formulari
- **ALESHORES** el botó d'enviament es deshabilita fins que es rep la resposta de l'API

---

### Requisit: Casos d'error E2E — pàgina ForgotPassword

La suite Playwright HA DE verificar tots els camins d'error a la pàgina `/forgot-password` sense dependre de SMTP real.

#### Escenari: Email no registrat mostra error en línia

- **DONAT** el visitant és a `/forgot-password`
- **QUAN** el visitant envia amb `notreal@example.com`
- **ALESHORES** un error en línia és visible sota el camp email
- **I** la pàgina NO navega a `/login`

#### Escenari: Format d'email invàlid — validació del navegador/client

- **DONAT** el visitant és a `/forgot-password`
- **QUAN** el visitant envia amb `no-es-un-email`
- **ALESHORES** es mostra un error de validació i no es fa cap crida a l'API (o l'API retorna 400 i l'error es mostra)

---

### Requisit: Casos d'error E2E — pàgina ResetPassword

La suite Playwright HA DE verificar tots els camins d'error a la pàgina `/reset-password`.

#### Escenari: Contrasenyes no coincidents — la validació del client bloqueja l'enviament

- **DONAT** el visitant navega a `/reset-password?token=<validToken>`
- **QUAN** el visitant introdueix `Pass1234!` al primer camp i `Diferente!` al segon i envia
- **ALESHORES** es mostra un error de validació del client
- **I** no es fa cap crida a `POST /auth/reset-password`

#### Escenari: Contrasenya massa curta — la validació del client bloqueja l'enviament

- **DONAT** el visitant és a `/reset-password?token=<validToken>`
- **QUAN** el visitant introdueix `curta` en tots dos camps de contrasenya i envia
- **ALESHORES** es mostra un error de validació del client (mínim 8 caràcters)

#### Escenari: Token expirat — el backend retorna 400, es mostra l'error i l'enllaç de reintent

- **DONAT** un `PasswordResetToken` existeix amb `expiresAt` en el passat (injectat via helper de test amb expiració manipulada)
- **QUAN** el visitant envia el formulari amb aquell token
- **ALESHORES** un missatge d'error és visible
- **I** un enllaç a `/forgot-password` és present a la pàgina

#### Escenari: Token ja usat — el backend retorna 400, es mostra l'error

- **DONAT** un token que ja ha estat consumit (injectar i usar-lo una vegada, i intentar-ho de nou)
- **QUAN** el visitant envia el formulari amb el token usat
- **ALESHORES** un missatge d'error és visible
- **I** un enllaç a `/forgot-password` és present

#### Escenari: La pàgina ResetPassword és públicament accessible sense JWT

- **DONAT** el visitant no té JWT a localStorage
- **QUAN** el visitant navega a `/reset-password?token=abc`
- **ALESHORES** el formulari de restabliment de contrasenya es renderitza (sense redirecció a `/login`)

---

### Requisit: Integració E2E en CI

Els nous tests E2E HAN DE ser executats automàticament al pipeline de CI de GitHub Actions juntament amb la suite Playwright existent. No calen credencials SMTP addicionals perquè l'endpoint d'injecció bypassa el lliurament d'email.

#### Escenari: CI executa els tests de forgot-password automàticament

- **DONAT** el workflow E2E de GitHub Actions arrenca el backend amb `E2E_TESTING=true`
- **QUAN** Playwright descobreix `e2e/tests/forgot-password.spec.ts`
- **ALESHORES** tots els tests d'aquell arxiu s'executen com a part del run de CI
- **I** el workflow NO requereix `MAIL_USER`, `MAIL_OAUTH_CLIENT_ID`, `MAIL_OAUTH_CLIENT_SECRET`, ni `MAIL_OAUTH_REFRESH_TOKEN` per passar
