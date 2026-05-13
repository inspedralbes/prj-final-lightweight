# Spec: Integració E2E en CI

## Propòsit

Automatitzar l'execució de la suite Playwright E2E a GitHub Actions en cada pull request que apunti a `main`, usant un entorn efímer amb el stack complet (PostgreSQL + NestJS backend + Vite frontend) aixecat de forma nativa dins del runner. Les execucions fallides HAN DE pujar artefactes de Playwright (trace, captura de pantalla, vídeo) per a la depuració post-mortem. El merge a `main` queda bloquejat fins que el check d'estat `e2e / playwright` passi.

---

## Requisits

### Requisit: Workflow de CI E2E a GitHub Actions

El repositori HA D'incloure un workflow de GitHub Actions a `.github/workflows/e2e.yml` que es dispari en cada event `pull_request` que apunti a `main` (i opcionalment en `workflow_dispatch`). El workflow HA D'executar un únic job anomenat `playwright` que: aixequi un service container de PostgreSQL 17; instal·li Node 20 i totes les dependències dels workspaces (back, front, e2e) amb caché de npm activada; compili el backend NestJS; aixequi el procés del backend amb `E2E_TESTING=true` i `NODE_ENV=test` i esperi que estigui disponible al port 3000; aixequi el frontend Vite en mode preview o dev i esperi al port 5173; executi `cd e2e && npx playwright test`; i pugi artefactes en cas de falla.

#### Escenari: El workflow es dispara en un PR a main

- **DONAT** un PR obert contra `main` amb canvis al codi
- **QUAN** es crea o actualitza el PR
- **ALESHORES** el workflow `e2e.yml` es dispara automàticament
- **I** el job `playwright` apareix com a check pendent al PR

#### Escenari: La suite completa passa en verd

- **DONAT** que tots els tests E2E passen amb el stack aixecat al runner
- **QUAN** el job `playwright` finalitza
- **ALESHORES** el check `e2e / playwright` queda en estat `success`
- **I** el PR es pot fer merge (si la resta de checks també passen)
- **I** no es pugen artefactes (només es pugen en falla)

#### Escenari: La suite falla i bloqueja el merge

- **DONAT** que almenys un test E2E falla durant l'execució del job
- **QUAN** el job `playwright` finalitza amb codi distint de 0
- **ALESHORES** el check `e2e / playwright` queda en estat `failure`
- **I** el PR no es pot fer merge mentre el check estigui en `failure`
- **I** es pugen els artefactes `e2e/test-results/` i `e2e/playwright-report/` a l'artefacte `e2e-report-<run_id>`

#### Escenari: El workflow es pot disparar manualment

- **DONAT** un desenvolupador amb permisos de `write` al repositori
- **QUAN** accedeix a Actions → e2e.yml → Run workflow
- **ALESHORES** el job es dispara amb els mateixos passos que en un PR
- **I** els resultats són visibles a la pestanya d'Actions

---

### Requisit: Stack efímer amb service container de PostgreSQL

El workflow HA D'usar un service container de GitHub Actions per a PostgreSQL 17 (`image: postgres:17`) amb health-check (`pg_isready`) perquè el backend només arrenqui quan la base de dades estigui llesta. La base de dades HA DE dir-se `lw_e2e`, l'usuari `postgres` i la contrasenya `postgres`. La `DATABASE_URL` injectada al backend HA DE ser `postgresql://postgres:postgres@localhost:5432/lw_e2e`.

#### Escenari: El backend arrenca amb la BD llesta

- **DONAT** que el service container de PostgreSQL ha superat el seu health-check
- **QUAN** s'executa el pas de build i inici del backend
- **ALESHORES** `npm run start:prod` (o equivalent) arrenca sense errors de connexió a la BD
- **I** Prisma completa les migracions automàticament (`prisma migrate deploy`)
- **I** el seed inicial s'aplica via `npx prisma db seed`

#### Escenari: El backend no arrenca sense BD

- **DONAT** que el service container de PostgreSQL no està llest (p. ex. health-check fallant)
- **QUAN** el pas intenta arrencar el backend
- **ALESHORES** el pas falla amb un error de connexió a PostgreSQL
- **I** el job finalitza amb `failure` abans d'intentar executar Playwright

#### Escenari: La BD és efímera — no persisteix entre runs

- **DONAT** un run anterior que va deixar dades a la BD del runner
- **QUAN** comença un nou run del workflow
- **ALESHORES** el service container de PostgreSQL s'inicia amb una BD buida
- **I** el seed s'aplica des de zero en arrencar el backend

---

### Requisit: Credencials de prova hardcoded al workflow (no a secrets)

El workflow HA D'injectar `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `VITE_BACK_URL`, `E2E_TESTING` i `NODE_ENV` com a variables `env:` directament al YAML, usant valors segurs i no productius. NO s'han de requerir nous secrets de GitHub Actions per executar E2E en CI.

#### Escenari: El workflow és executable sense configurar secrets addicionals

- **DONAT** un fork del repositori sense cap secret configurat
- **QUAN** s'obre un PR al fork (o es dispara manualment el workflow)
- **ALESHORES** el job `playwright` arrenca i usa les credencials hardcoded del YAML
- **I** no falla per `Secret not found` ni per variables d'entorn que falten

#### Escenari: Les credencials de CI no són reutilitzables en producció

- **DONAT** l'arxiu `.github/workflows/e2e.yml` inspeccionat per un auditor
- **QUAN** es revisen els valors de `JWT_SECRET` i `DATABASE_URL`
- **ALESHORES** els valors estan clarament etiquetats amb un comentari `# Només CI — mai usar en producció`
- **I** el valor de `JWT_SECRET` és diferent del que usa el secret `ENV_FILE` de producció

---

### Requisit: Caché de dependències npm i browsers de Playwright

El workflow HA DE cachear `node_modules` de cada workspace (`src/back`, `src/front`, `e2e`) amb clau basada en el hash del `package-lock.json` corresponent, i HA DE cachear els binaris de browsers de Playwright a `~/.cache/ms-playwright` amb clau basada en `e2e/package-lock.json`. Un MISS de caché HA DE seguir resultant en un run exitós (fallback a instal·lació nova).

#### Escenari: Un cache hit accelera el job

- **DONAT** un run previ que va escalfar la caché amb les mateixes versions de dependències
- **QUAN** s'executa el job amb el mateix `package-lock.json`
- **ALESHORES** el pas `Cache node_modules` reporta `Cache hit`
- **I** el pas `Cache Playwright browsers` reporta `Cache hit`
- **I** el temps total del job és inferior a 4 minuts (enfront de ~8 min en fred)

#### Escenari: Un cache miss no trenca el job

- **DONAT** un canvi a `e2e/package-lock.json` (p. ex. bump de `@playwright/test`)
- **QUAN** el job s'executa per primera vegada amb la nova versió
- **ALESHORES** el pas `Cache Playwright browsers` reporta `Cache miss`
- **I** els browsers es descarreguen i instal·len correctament
- **I** el job finalitza amb èxit (o falla per raó dels tests, no del setup)

---

### Requisit: Artefactes de depuració pujats en cas de falla

El workflow HA DE pujar `e2e/test-results/` i `e2e/playwright-report/` com a un únic artefacte de GitHub Actions anomenat `e2e-report-${{ github.run_id }}` amb retenció de 7 dies quan el pas `playwright` falli o es cancel·li. El pas de pujada HA D'usar `if: failure()` perquè no s'executi en builds en verd.

#### Escenari: Els artefactes estan disponibles després d'una falla

- **DONAT** un test E2E que falla i genera trace, captura de pantalla i vídeo
- **QUAN** el job `playwright` finalitza amb `failure`
- **ALESHORES** el pas `Upload Playwright report` s'executa
- **I** l'artefacte `e2e-report-<run_id>` apareix a la pestanya Summary del run
- **I** l'artefacte conté `playwright-report/index.html` amb els detalls de la falla
- **I** l'artefacte conté els arxius `trace.zip`, `.png` i `.webm` del test fallat

#### Escenari: Els artefactes no es pugen en un run verd

- **DONAT** que tots els tests E2E passen
- **QUAN** el job `playwright` finalitza amb `success`
- **ALESHORES** el pas `Upload Playwright report` es salta (`if: failure()` avalua a false)
- **I** no apareix cap artefacte a la pestanya Summary del run

#### Escenari: Els artefactes expiren després de 7 dies

- **DONAT** un artefacte `e2e-report-<run_id>` pujat fa més de 7 dies
- **QUAN** s'accedeix al run a la UI de GitHub
- **ALESHORES** l'artefacte ja no està disponible per a descàrrega
- **I** el run mostra `Artifact expired` o equivalent

---

### Requisit: Espera activa (readiness check) abans de llançar Playwright

El workflow HA D'esperar que tant el backend (port 3000) com el frontend (port 5173) siguin accessibles abans d'executar Playwright, usant un bucle de reintents (`curl --retry 30 --retry-delay 2 --retry-connrefused`) o equivalent. Si algun dels serveis no respon en 60 segons, el pas HA DE fallar amb un missatge d'error explícit.

#### Escenari: El backend està llest abans que Playwright arrenqui

- **DONAT** que el backend tarda 15 segons a compilar i arrencar
- **QUAN** el pas de readiness-check executa el bucle de reintents
- **ALESHORES** el pas espera fins que `GET http://localhost:3000/api` respon amb qualsevol codi HTTP
- **I** només aleshores comença el pas següent (`npx playwright test`)

#### Escenari: El backend no respon — el job falla ràpid

- **DONAT** un error al pas de build del backend que impedeix el seu arrencada
- **QUAN** el pas de readiness-check espera 60 segons sense resposta
- **ALESHORES** el pas falla amb el missatge `"El backend no estava llest al port 3000 en 60s"`
- **I** el job finalitza amb `failure` sense haver executat cap test

---

### Requisit: `PLAYWRIGHT_API_URL` documentat a `e2e/.env.example`

L'arxiu `e2e/.env.example` HA D'incloure la variable `PLAYWRIGHT_API_URL` amb el valor per defecte `http://localhost:3000/api` i un comentari en línia explicant el seu propòsit. Aquesta variable ja és consumida per `e2e/global-setup.ts`.

#### Escenari: La variable està documentada a .env.example

- **DONAT** `e2e/.env.example` al repositori
- **QUAN** un desenvolupador l'obre
- **ALESHORES** troba la línia `PLAYWRIGHT_API_URL=http://localhost:3000/api` amb un comentari explicatiu
- **I** la documentació és coherent amb l'ús a `e2e/global-setup.ts`

---

### Requisit: Protecció de branca activa a `main` per al check E2E

El repositori HA DE tenir una regla de branch protection a `main` que exigeixi que el check d'estat `e2e / playwright` passi abans que qualsevol PR pugui fer-se merge. Aquest és un canvi a la configuració del repositori de GitHub, no un canvi de codi, però forma part de la Definició de Fet per a LW-445.

#### Escenari: El merge queda bloquejat si el check falla

- **DONAT** la branch protection activada a `main`
- **I** un PR el check `e2e / playwright` del qual està en estat `failure`
- **QUAN** un desenvolupador intenta fer merge del PR
- **ALESHORES** GitHub bloqueja el merge amb el missatge `"Required status check 'e2e / playwright' has not passed"`

#### Escenari: El merge es permet si el check passa

- **DONAT** la branch protection activada a `main`
- **I** un PR el check `e2e / playwright` del qual està en estat `success`
- **QUAN** un desenvolupador amb permisos intenta fer merge del PR
- **ALESHORES** el merge es permet (assumint que la resta de checks requerits també passen)
