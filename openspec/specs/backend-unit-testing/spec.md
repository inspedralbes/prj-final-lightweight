## ADDED Requirements

### Requirement: La configuració de Vitest és present i funcional

El sistema HAURÀ DE proporcionar un fitxer `vitest.config.ts` a `src/back/` que configuri Vitest per executar tests unitaris NestJS amb transformació SWC, APIs de test globals i entorn Node.

#### Scenario: El fitxer de configuració existeix

- **QUAN** un desenvolupador obre `src/back/vitest.config.ts`
- **LLAVORS** el fitxer HAURÀ D'exportar un objecte `defineConfig` de Vitest amb `test.globals: true`, `test.environment: 'node'` i `test.include: ['src/**/*.spec.ts']` (Vitest 4 usa el transformador Oxc natiu; no cal cap plugin addicional)

#### Scenario: Els tipus TypeScript per als globals es resolen

- **QUAN** un fitxer spec usa `describe`, `it`, `expect` o `vi` sense una sentència d'importació
- **LLAVORS** el compilador TypeScript HAURÀ DE resoldre aquests globals via `tsconfig.vitest.json` (que afegeix `"types": ["vitest/globals"]`) sense errors

#### Scenario: Els metadades dels decoradors NestJS es preserven en temps d'execució

- **QUAN** Vitest executa un spec que instancia un `TestingModule` NestJS usant `@nestjs/testing`
- **LLAVORS** el transformador Oxc integrat a Vitest 4 HAURÀ D'emetre metadades de decoradors perquè la resolució de DI de NestJS tingui èxit sense errors en temps d'execució

### Requirement: Els scripts npm test invoquen Vitest

Els scripts `test`, `test:watch` i `test:cov` de `package.json` a `src/back/` HAURAN DE delegar a Vitest. L'script `test:e2e` HAURÀ DE romandre sense canvis (basat en Jest).

#### Scenario: Execució de tests unitaris

- **QUAN** un desenvolupador executa `npm test` dins `src/back/`
- **LLAVORS** la comanda HAURÀ D'executar `vitest run` i reportar pas/error per a tots els fitxers `*.spec.ts` (excloent `test/*.spec.ts` si n'hi ha)

#### Scenario: Execució de tests en mode watch

- **QUAN** un desenvolupador executa `npm run test:watch` dins `src/back/`
- **LLAVORS** la comanda HAURÀ D'executar `vitest` (mode watch interactiu) i re-executar els specs afectats en desar un fitxer

#### Scenario: Generació d'un informe de cobertura

- **QUAN** un desenvolupador executa `npm run test:cov` dins `src/back/`
- **LLAVORS** la comanda HAURÀ D'executar `vitest run --coverage` usant `@vitest/coverage-v8` i escriure un informe de cobertura HTML/text a `src/back/coverage/`

#### Scenario: L'script E2E no es veu afectat

- **QUAN** un desenvolupador executa `npm run test:e2e` dins `src/back/`
- **LLAVORS** la comanda HAURÀ DE seguir executant Jest via `./test/jest-e2e.json` sense modificació

### Requirement: El spec existent passa amb Vitest

L'`src/back/src/app.controller.spec.ts` migrat HAURÀ DE passar amb Vitest sense necessitat de reescriptures estructurals.

#### Scenario: Spec base en verd

- **QUAN** `npm test` s'executa dins `src/back/`
- **LLAVORS** el spec `AppController` HAURÀ DE reportar 1 test passat: `should return "Hello World!"`

#### Scenario: No resten imports específics de Jest

- **QUAN** s'inspecciona el fitxer spec
- **LLAVORS** NO HAURÀ D'importar de `jest` ni `@types/jest`; els globals (`describe`, `it`, `expect`, `beforeEach`) HAURAN D'estar disponibles sense import explícit

### Requirement: Jest i ts-jest s'eliminen de devDependencies

El fitxer `src/back/package.json` NO HAURÀ DE llistar `jest`, `ts-jest` ni `@types/jest` a `devDependencies`. El bloc de configuració `"jest"` HAURÀ DE ser eliminat de `package.json`.

#### Scenario: Arbre de dependències net

- **QUAN** s'executa `npm ls jest` dins `src/back/` després de la migració
- **LLAVORS** `jest` NO HAURÀ D'aparèixer com a dependència directa (pot ser una dep transitiva de paquets no relacionats, cosa acceptable)

#### Scenario: Cap configuració Jest obsoleta

- **QUAN** s'obre `package.json`
- **LLAVORS** NO HAURÀ D'haver cap clau `"jest"` de nivell superior al JSON

### Requirement: Testabilitat — verificació del harness

La configuració del harness de tests HAURÀ DE ser verificable mitjançant un procediment documentat.

#### Scenario: Execució completa de tests passa al CI

- **QUAN** `npm test` s'executa en un checkout net (després de `npm install`) dins `src/back/`
- **LLAVORS** Vitest HAURÀ DE descobrir i executar tots els fitxers `*.spec.ts` sota `src/` i sortir amb codi 0 si tots passen

#### Scenario: Procediment de verificació manual

- **QUAN** un desenvolupador segueix el pas de QA manual: `cd src/back && npm test`
- **LLAVORS** la sortida de consola HAURÀ DE mostrar `1 passed` (o més, si s'afegeixen nous specs) sense errors ni imports no resolts

---

### Requirement: Tests unitaris de AuthService

El sistema HAURÀ DE proporcionar un fitxer `src/back/src/auth/auth.service.spec.ts` que verifiqui el comportament de negoci d'`AuthService` de forma aïllada de la base de dades i de bcrypt.

#### Scenario: Registre d'un usuari nou

- **QUAN** `AuthService.register` s'invoca amb un DTO vàlid i `PrismaService.user.findFirst` retorna `null`
- **LLAVORS** el mètode HAURÀ DE cridar `PrismaService.user.create` amb la contrasenya hasheada i retornar `{ message: 'User <username> registered successfully' }`

#### Scenario: Registre amb nom d'usuari o correu ja existent

- **QUAN** `AuthService.register` s'invoca i `PrismaService.user.findFirst` retorna un usuari existent
- **LLAVORS** el mètode HAURÀ DE llançar `ConflictException` sense cridar `PrismaService.user.create`

#### Scenario: Login amb credencials vàlides

- **QUAN** `AuthService.login` s'invoca amb username i password correctes, l'usuari existeix a la BD i `bcrypt.compare` retorna `true`
- **LLAVORS** el mètode HAURÀ DE retornar un objecte amb `access_token` (resultat de `JwtService.sign`) i `user` amb els camps `id`, `username`, `role` i `coachId`

#### Scenario: Login amb credencials invàlides — usuari no existeix

- **QUAN** `AuthService.login` s'invoca i `PrismaService.user.findUnique` retorna `null`
- **LLAVORS** el mètode HAURÀ DE llançar `UnauthorizedException` amb missatge `'Invalid credentials'`

#### Scenario: Login amb credencials invàlides — contrasenya incorrecta

- **QUAN** `AuthService.login` s'invoca, l'usuari existeix però `bcrypt.compare` retorna `false`
- **LLAVORS** el mètode HAURÀ DE llançar `UnauthorizedException` sense generar cap token JWT

---

### Requirement: Tests unitaris de JwtStrategy

El sistema HAURÀ DE proporcionar un fitxer `src/back/src/auth/strategies/jwt.strategy.spec.ts` que verifiqui el mètode `validate` de `JwtStrategy`.

#### Scenario: Payload vàlid amb usuari existent

- **QUAN** `JwtStrategy.validate` s'invoca amb un payload `{ userId, role }` i `PrismaService.user.findUnique` retorna un usuari
- **LLAVORS** el mètode HAURÀ DE retornar `{ userId, username, role, coachId }` llegint els camps de la BD (no del token)

#### Scenario: Payload amb userId inexistent

- **QUAN** `JwtStrategy.validate` s'invoca i `PrismaService.user.findUnique` retorna `null`
- **LLAVORS** el mètode HAURÀ DE llançar `UnauthorizedException` amb missatge `'User not found'`

---

### Requirement: Tests unitaris de CoachGuard

El sistema HAURÀ DE proporcionar un fitxer `src/back/src/auth/guards/coach.guard.spec.ts` que verifiqui el mètode `handleRequest` de `CoachGuard`.

#### Scenario: Usuari amb rol COACH — accés concedit

- **QUAN** `CoachGuard.handleRequest` s'invoca amb `err = null` i `user = { role: 'COACH' }`
- **LLAVORS** el mètode HAURÀ DE retornar l'objecte `user` sense llançar cap excepció

#### Scenario: Usuari amb rol CLIENT — accés denegat

- **QUAN** `CoachGuard.handleRequest` s'invoca amb `user = { role: 'CLIENT' }`
- **LLAVORS** el mètode HAURÀ DE llançar `ForbiddenException` amb missatge `'Only coaches can access this resource'`

#### Scenario: Sense token (user és null)

- **QUAN** `CoachGuard.handleRequest` s'invoca amb `user = null`
- **LLAVORS** el mètode HAURÀ DE llançar `UnauthorizedException`

---

### Requirement: Tests unitaris d'InvitationsService

El sistema HAURÀ DE proporcionar un fitxer `src/back/src/invitations/invitations.service.spec.ts` que verifiqui els fluxos principals d'`InvitationsService`.

#### Scenario: Creació d'una invitació per codi

- **QUAN** `InvitationsService.create` s'invoca per un coach existent
- **LLAVORS** el mètode HAURÀ DE cridar `PrismaService.invitation.create` amb un codi únic generat i retornar la invitació creada

#### Scenario: Acceptació d'una invitació vàlida

- **QUAN** `InvitationsService.accept` s'invoca amb un codi PENDING i un clientId sense coach assignat
- **LLAVORS** el mètode HAURÀ DE transicionar la invitació a estat `ACCEPTED` i actualitzar `User.coachId` del client dins d'una transacció Prisma

#### Scenario: Rebuig d'una invitació vàlida

- **QUAN** `InvitationsService.reject` s'invoca amb una invitació PENDING dirigida al client
- **LLAVORS** el mètode HAURÀ DE transicionar la invitació a estat `REVOKED` (valor d'enum existent a l'esquema) sense modificar `User.coachId`

#### Scenario: Acceptació d'una invitació amb codi inexistent

- **QUAN** `InvitationsService.accept` s'invoca amb un codi que no existeix a la BD
- **LLAVORS** el mètode HAURÀ DE llançar `NotFoundException`

#### Scenario: Client que ja té coach assignat no pot acceptar una altra invitació

- **QUAN** `InvitationsService.accept` s'invoca per un client que ja té `coachId` no nul a la BD
- **LLAVORS** el mètode HAURÀ DE llançar `BadRequestException` amb missatge `'Client already has an assigned coach'`

---

### Requirement: Tests unitaris de RoutinesService

El sistema HAURÀ DE proporcionar un fitxer `src/back/src/routines/routines.service.spec.ts` que verifiqui els fluxos principals de `RoutinesService`.

#### Scenario: Creació d'una rutina per un coach

- **QUAN** `RoutinesService.createRoutine` s'invoca amb un coachId i un DTO vàlid
- **LLAVORS** el mètode HAURÀ DE cridar `PrismaService.routine.create` i retornar la rutina creada

#### Scenario: Obtenció de les rutines d'un coach

- **QUAN** `RoutinesService.getCoachRoutines` s'invoca amb un coachId
- **LLAVORS** el mètode HAURÀ DE cridar `PrismaService.routine.findMany` filtrant per `coachId` i retornar la llista

#### Scenario: Assignació d'una rutina a un client en crear-la

- **QUAN** `RoutinesService.createRoutine` s'invoca per un COACH amb un array `clientIds` no buit
- **LLAVORS** el mètode HAURÀ DE cridar `PrismaService.routineAssignment.upsert` per a cada clientId i retornar la rutina creada amb les assignacions

#### Scenario: Accés a una rutina d'un altre coach — denegat

- **QUAN** `RoutinesService.deleteRoutine` o `RoutinesService.updateRoutine` s'invoca amb un routineId que pertany a un coach diferent del que fa la petició
- **LLAVORS** el mètode HAURÀ DE llançar `ForbiddenException` o `NotFoundException`
