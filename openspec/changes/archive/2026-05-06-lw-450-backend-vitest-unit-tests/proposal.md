## Why

El harness de Vitest al backend ja està configurat (LW-448), però la cobertura de tests unitaris reals és pràcticament nul·la: només existeix `app.controller.spec.ts` (scaffolding inicial). Els mòduls P0 identificats a `unit-testing-priorities` (auth, guards, invitacions i rutines) contenen la lògica de negoci de més alt risc del projecte i no tienen cap test automatitzat. Amb la defensa del TFG imminent, cal establir la cobertura bàsica d'aquests mòduls per evitar regressions crítiques en la fase final.

## What Changes

- Nous fitxers `*.spec.ts` per als cinc mòduls de prioritat P0 del backend:
  - `src/back/src/auth/auth.service.spec.ts` — login, register, hashing i generació JWT
  - `src/back/src/auth/strategies/jwt.strategy.spec.ts` — validació de payload i resolució d'usuari
  - `src/back/src/auth/guards/jwt-auth.guard.spec.ts` — accés amb token vàlid i denegació sense token
  - `src/back/src/auth/guards/coach.guard.spec.ts` — accés per rol COACH i denegació per rol CLIENT
  - `src/back/src/invitations/invitations.service.spec.ts` — creació, acceptació, rebuig i expiració d'invitacions
  - `src/back/src/routines/routines.service.spec.ts` — CRUD de rutines, exercicis niats i assignacions amb autorització per `coachId`
- Tots els tests usen `@nestjs/testing` `TestingModule` amb `PrismaService` mockat com a objecte pla
- No es modifica cap fitxer de producció ni de configuració (Vitest, tsconfig, package.json)

## Capabilities

### New Capabilities

_Cap. Aquest canvi no introdueix cap capacitat nova visible per a l'usuari._

### Modified Capabilities

- `backend-unit-testing`: s'afegeixen tests reals als escenaris que fins ara no tenien cobertura automatitzada. No canvien els requisits del spec; s'implementen els escenaris de verificació que el spec ja descrivia com a objectiu.

## Impact

**Codi afectat:**

- Nous fitxers `*.spec.ts` a `src/back/src/auth/`, `src/back/src/invitations/` i `src/back/src/routines/`
- Cap modificació de codi de producció

**Mòduls backend implicats:** `auth`, `invitations`, `routines`, `prisma`

**Dependències de test:**

- `@nestjs/testing` (ja present)
- `vitest` + `@vitest/coverage-v8` (ja presents des de LW-448)
- Mocks plans de `PrismaService` (sense llibreries de mock externes)
- `bcrypt` (ja present a `devDependencies`)

**Testing:** cada spec s'executa amb `npm test` dins `src/back/`. La cobertura es genera amb `npm run test:cov`. Cap impacte en WebSocket, frontend ni CI/CD.

**No-goals:**

- No es cobreixen mòduls P1/P2 (ClientsService, SessionService, ChatService, Gateways) en aquest US
- No s'escriuen tests d'integració ni E2E en aquest canvi
- No es modifica la configuració de Vitest ni el `tsconfig.vitest.json`

> Tracking: Jira US **LW-450** — _Implementar tests unitaris inicials del backend amb Vitest_. Parent epic: Testing & QA.
