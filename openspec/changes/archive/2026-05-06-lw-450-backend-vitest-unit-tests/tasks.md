## 1. Preparació i mocks compartits

- [x] 1.1 Revisar `src/back/src/auth/auth.service.ts`, `jwt.strategy.ts`, `coach.guard.ts`, `jwt-auth.guard.ts` per identificar totes les dependències a mockar (`PrismaService`, `JwtService`, `ConfigService`, `bcrypt`)
- [x] 1.2 Revisar `src/back/src/invitations/invitations.service.ts` per identificar els mètodes de Prisma i les crides a `EventsGateway` que cal mockar
- [x] 1.3 Revisar `src/back/src/routines/routines.service.ts` per identificar els mètodes de Prisma que cal mockar (Routine, RoutineExercise, RoutineAssignment)
- [x] 1.4 Verificar que `npm test` passa a `src/back/` abans de començar (el test base `app.controller.spec.ts` ha d'estar en verd)

## 2. Tests d'AuthService

- [x] 2.1 Crear `src/back/src/auth/auth.service.spec.ts` amb `TestingModule` que proveeix `AuthService`, mock pla de `PrismaService` i mock pla de `JwtService`
- [x] 2.2 Afegir `vi.mock('bcrypt')` al fitxer per fer que `hash` i `compare` siguin deterministes
- [x] 2.3 Implementar el test `register` — cas feliç: `findFirst` retorna `null`, `create` retorna usuari nou → missatge d'èxit
- [x] 2.4 Implementar el test `register` — usuari ja existent: `findFirst` retorna usuari → `ConflictException`
- [x] 2.5 Implementar el test `login` — cas feliç: `findUnique` retorna usuari, `compare` → `true` → retorna `access_token` i `user`
- [x] 2.6 Implementar el test `login` — usuari no existeix: `findUnique` → `null` → `UnauthorizedException`
- [x] 2.7 Implementar el test `login` — contrasenya incorrecta: `compare` → `false` → `UnauthorizedException`
- [x] 2.8 Verificar que `npm test` passa amb els nous tests

## 3. Tests de JwtStrategy

- [x] 3.1 Crear `src/back/src/auth/strategies/jwt.strategy.spec.ts` amb mock de `ConfigService` (retorna `'test-secret'`) i mock pla de `PrismaService`
- [x] 3.2 Implementar el test `validate` — cas feliç: `findUnique` retorna usuari → retorna `{ userId, username, role, coachId }`
- [x] 3.3 Implementar el test `validate` — usuari no existeix: `findUnique` → `null` → `UnauthorizedException`
- [x] 3.4 Verificar que `npm test` passa amb els nous tests

## 4. Tests de CoachGuard

- [x] 4.1 Crear `src/back/src/auth/guards/coach.guard.spec.ts` instanciant `CoachGuard` directament (sense `TestingModule` si no és necessari)
- [x] 4.2 Implementar el test `handleRequest` — rol COACH: retorna `user`
- [x] 4.3 Implementar el test `handleRequest` — rol CLIENT: llança `ForbiddenException`
- [x] 4.4 Implementar el test `handleRequest` — `user = null`: llança `UnauthorizedException`
- [x] 4.5 Verificar que `npm test` passa amb els nous tests

## 5. Tests d'InvitationsService

- [x] 5.1 Crear `src/back/src/invitations/invitations.service.spec.ts` amb `TestingModule` que proveeix `InvitationsService`, mock pla de `PrismaService` (cobreix User, Invitation, ClientProfile) i mock pla d'`EventsGateway`
- [x] 5.2 Implementar el test de creació d'invitació: `invitation.create` crida i retorna objecte invitació
- [x] 5.3 Implementar el test d'acceptació vàlida: invitació PENDING → `ACCEPTED`, `user.update` crida per a `coachId`, emissió de notificació via `EventsGateway`
- [x] 5.4 Implementar el test de rebuig: invitació PENDING → `REJECTED`, sense actualitzar `coachId`
- [x] 5.5 Implementar el test d'acceptació amb codi inexistent: `invitation.findUnique` → `null` → `NotFoundException`
- [x] 5.6 Implementar el test de client amb coach ja assignat: `user.coachId` no és null → excepció de conflicte
- [x] 5.7 Verificar que `npm test` passa amb els nous tests

## 6. Tests de RoutinesService

- [x] 6.1 Crear `src/back/src/routines/routines.service.spec.ts` amb `TestingModule` que proveeix `RoutinesService` i mock pla de `PrismaService` (cobreix Routine, RoutineExercise, RoutineAssignment)
- [x] 6.2 Implementar el test de creació de rutina: `routine.create` crida i retorna rutina nova
- [x] 6.3 Implementar el test d'obtenció de rutines per coach: `routine.findMany` filtrat per `coachId`
- [x] 6.4 Implementar el test d'assignació de rutina a client: `routineAssignment.create` crida i retorna assignació
- [x] 6.5 Implementar el test d'accés no autoritzat: sol·licitud d'una rutina que pertany a un altre coach → `ForbiddenException` o `NotFoundException`
- [x] 6.6 Verificar que `npm test` passa amb tots els nous tests

## 7. Verificació final

- [x] 7.1 Executar `npm test` a `src/back/` i confirmar que tots els specs passen (0 failures)
- [x] 7.2 Executar `npm run test:cov` a `src/back/` i revisar que els mòduls coberts superen el 80 % de cobertura de branques
- [x] 7.3 Executar `npm run build` a `src/back/` i confirmar que no hi ha errors de TypeScript
- [x] 7.4 Executar `npm run lint` a `src/back/` i confirmar que no hi ha errors d'ESLint
