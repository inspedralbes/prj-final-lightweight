## Context

El backend de LightWeight (NestJS 11, TypeScript 5.7) compta des de LW-448 amb un harness de Vitest funcional (`vitest.config.ts`, `tsconfig.vitest.json`, scripts npm). L'única cobertura existent és `app.controller.spec.ts` (1 test de scaffolding).

L'spec `unit-testing-priorities` defineix cinc mòduls P0 que han de tenir cobertura obligatòria abans del lliurament del TFG:

| Mòdul                | Fitxer                               | Dependències a mockar                   |
| -------------------- | ------------------------------------ | --------------------------------------- |
| `AuthService`        | `auth/auth.service.ts`               | `PrismaService`, `JwtService`, `bcrypt` |
| `JwtStrategy`        | `auth/strategies/jwt.strategy.ts`    | `PrismaService`, `ConfigService`        |
| `JwtAuthGuard`       | `auth/guards/jwt-auth.guard.ts`      | `ExecutionContext` mock                 |
| `CoachGuard`         | `auth/guards/coach.guard.ts`         | `ExecutionContext` mock, `user.role`    |
| `InvitationsService` | `invitations/invitations.service.ts` | `PrismaService`, `EventsGateway`        |
| `RoutinesService`    | `routines/routines.service.ts`       | `PrismaService`                         |

## Goals / Non-Goals

**Goals:**

- Implementar tests unitaris per als 5 mòduls P0, cobrint els camins feliços i els camins d'error principals
- Usar `@nestjs/testing` `TestingModule` com a harness estàndard de NestJS
- Mockar `PrismaService` amb objectes plans de Vitest (`vi.fn()`) per aïllar la lògica de negoci de la BD
- Assolir un mínim de 80 % de cobertura de branques als mòduls coberts
- Tots els tests han de passar amb `npm test` dins `src/back/`

**Non-Goals:**

- No es cobriran mòduls P1/P2 (ClientsService, SessionService, ChatService, gateways) en aquest US
- No es configurarà cap harness nou (Vitest ja és funcional)
- No es modificarà codi de producció per facilitar la testabilitat
- No es faran tests d'integració ni de socket real

## Decisions

### D1: Mock de PrismaService com a objecte pla de Vitest

**Decisió:** `PrismaService` es substitueix per un objecte pla on cada mètode és un `vi.fn()`:

```ts
const prismaMock = {
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  // ...
};
```

**Alternativa considerada:** `jest-mock-extended` o `prisma-mock`. Descartada perquè afegeix dependències externes i `vi.fn()` és suficient per als escenaris de P0.

**Alternativa considerada:** Aixecar una BD de test amb `prisma migrate deploy`. Descartada: és un test d'integració, no unitari; ralentitza el CI i s'escapa de l'àmbit d'aquest US.

**Motiu:** aïllament màxim, zero dependències noves, velocitat d'execució < 1 s per spec.

---

### D2: Mock de bcrypt via `vi.mock()`

**Decisió:** `bcrypt` es moca al nivell de mòdul per evitar el cost de CPU real del hashing:

```ts
vi.mock("bcrypt", () => ({
  hash: vi.fn().mockResolvedValue("hashed"),
  compare: vi.fn().mockResolvedValue(true),
}));
```

**Motiu:** els tests d'`AuthService` han de ser ràpids i deterministes; la correcció del hash en si no és responsabilitat del test unitari.

---

### D3: Mock de JwtService i ConfigService

**Decisió:** `JwtService` es proveeix com a objecte pla `{ sign: vi.fn().mockReturnValue('mock.jwt.token') }`. `ConfigService` es moca retornant `'test-secret'` per a `JWT_SECRET`.

**Motiu:** `JwtStrategy` necessita `ConfigService` al constructor per obtenir `JWT_SECRET`; sense mock llançaria una excepció. `JwtService.sign` no ha de generar un JWT real en un test unitari.

---

### D4: ExecutionContext mock per als guards

**Decisió:** `ExecutionContext` es construeix manualment com un objecte pla que retorna un `Request` mock:

```ts
const mockContext = (user?: any) => ({
  switchToHttp: () => ({
    getRequest: () => ({ user }),
  }),
  getHandler: () => ({}),
  getClass: () => ({}),
});
```

**Motiu:** els guards de NestJS (que estenen `AuthGuard('jwt')`) no necessiten un context real per provar `handleRequest`; el mètode rep `user` i `err` directament.

**Nota:** `JwtAuthGuard` delega tota la lògica a `AuthGuard('jwt')`; el seu test unitari és minimal (verifica que no sobreescriu el comportament). El test significatiu és el de `CoachGuard.handleRequest`.

---

### D5: Estructura de cada fitxer spec

Cada spec segueix el patró:

```
describe('<NomDelMòdul>', () => {
  // setup: beforeEach amb TestingModule / objectes plans
  describe('<nomDelMètode>', () => {
    it('hauria de <comportament esperat>', async () => { ... });
    it('hauria de llançar <excepció> si <condició>', async () => { ... });
  });
});
```

**Nota d'implementació:** `eslint.config.mjs` declara `globals.jest` però no `globals.vitest`, de manera que els globals de Vitest (`vi`, `describe`, `it`, `expect`, `beforeEach`) no es reconeixen sense importació explícita. Per tant, cada fitxer spec ha d'incloure:

```ts
import { vi, describe, it, expect, beforeEach } from "vitest";
```

Si el fitxer no utilitza `vi` (per exemple, un guard que s'instancia directament sense mocks), s'ometen els globals innecessaris de la importació.

---

### D6: Cobertura mínima per mòdul

| Mòdul                | Camins feliços                                                    | Camins d'error                                                           |
| -------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `AuthService`        | register OK, login OK                                             | username ja existent, credencials invàlides                              |
| `JwtStrategy`        | payload vàlid → retorna user                                      | usuari no existeix → `UnauthorizedException`                             |
| `JwtAuthGuard`       | token present → deixa passar                                      | — (delegat a `AuthGuard`)                                                |
| `CoachGuard`         | rol COACH → deixa passar                                          | rol CLIENT → `ForbiddenException`, sense token → `UnauthorizedException` |
| `InvitationsService` | crear invitació, acceptar, rebutjar                               | codi inexistent, invitació ja acceptada, client ja té coach              |
| `RoutinesService`    | crear rutina, obtenir per coachId, assignar a client, desassignar | coach no autoritzat per veure rutina d'altri                             |

## Risks / Trade-offs

**[Risc] `CoachGuard` estén `AuthGuard('jwt')` de Passport, que fa lògica interna complexa.**
→ Mitigació: es prova `handleRequest` directament (que és on viu la lògica de rol) en lloc de cridar `canActivate` passant per Passport.

**[Risc] `JwtStrategy.validate` fa una crida a BD; el mock podria no reflectir la interfície real de Prisma.**
→ Mitigació: els mocks de `PrismaService` es tipifiquen amb `Partial<PrismaService>` per atrapar divergències en temps de compilació.

**[Risc] `InvitationsService` (212 LOC) té moltes branques; cobrir-les totes pot ser costós.**
→ Mitigació: es cobreixen els escenaris descrits explícitament a `unit-testing-priorities`; la cobertura del 100% de branques no és un objectiu d'aquest US.

**[Trade-off] Mocks plans vs. mock automàtic de Prisma.**
→ Els mocks plans requereixen manteniment manual si canvia l'API de Prisma, però eviten dependències externes i funcionen amb zero configuració addicional.
