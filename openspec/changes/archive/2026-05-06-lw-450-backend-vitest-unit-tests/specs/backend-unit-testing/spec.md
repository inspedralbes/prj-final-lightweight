## ADDED Requirements

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

- **QUAN** `InvitationsService.createInvitation` s'invoca per un coach existent
- **LLAVORS** el mètode HAURÀ DE cridar `PrismaService.invitation.create` amb un codi únic generat i retornar la invitació creada

#### Scenario: Acceptació d'una invitació vàlida

- **QUAN** `InvitationsService.accept` s'invoca amb un codi PENDING i un clientId sense coach assignat
- **LLAVORS** el mètode HAURÀ DE transicionar la invitació a estat `ACCEPTED` i actualitzar `User.coachId` del client dins d'una transacció Prisma

#### Scenario: Rebuig d'una invitació vàlida

- **QUAN** `InvitationsService.reject` s'invoca amb una invitació PENDING dirigida al client
- **LLAVORS** el mètode HAURÀ DE transicionar la invitació a estat `REVOKED` (valor d'enum existent a l'esquema) sense modificar `User.coachId`

#### Scenario: Acceptació d'una invitació amb codi inexistent

- **QUAN** `InvitationsService.acceptInvitation` s'invoca amb un codi que no existeix a la BD
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

- **QUAN** `RoutinesService.getRoutinesByCoach` s'invoca amb un coachId
- **LLAVORS** el mètode HAURÀ DE cridar `PrismaService.routine.findMany` filtrant per `coachId` i retornar la llista

#### Scenario: Assignació d'una rutina a un client en crear-la

- **QUAN** `RoutinesService.createRoutine` s'invoca per un COACH amb un array `clientIds` no buit
- **LLAVORS** el mètode HAURÀ DE cridar `PrismaService.routineAssignment.upsert` per a cada clientId i retornar la rutina creada amb les assignacions

#### Scenario: Accés a una rutina d'un altre coach — denegat

- **QUAN** `RoutinesService.getRoutineById` (o mètode equivalent) s'invoca amb un routineId que pertany a un coach diferent del que fa la petició
- **LLAVORS** el mètode HAURÀ DE llançar `ForbiddenException` o `NotFoundException`
