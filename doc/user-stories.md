# Tasques — Sistema d'invitacions coach → client

**Èpica**: Gestió de relacions coach-client
**Actualitzat**: 2026-02-24

---

## TASK-01 — BBDD: schema i migració

**Tipus**: Base de dades
**Dependències**: —

Actualitzar `prisma/schema.prisma`:

- Eliminar el camp `invitationCode` del model `User`
- Afegir l'enum `InvitationStatus` (`PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED`)
- Afegir el model `Invitation`: `id`, `coachId` (FK), `clientId` (FK nullable), `code` (unique), `status`, `expiresAt` (nullable), `createdAt`, `acceptedAt` (nullable)

Executar `prisma migrate dev` per generar i aplicar la migració.

---

## TASK-02 — Backend: mòdul d'invitacions

**Tipus**: Backend
**Dependències**: TASK-01

Crear `src/invitations/` amb:

- **DTOs** — `create-invitation.dto.ts` (`expiresAt` opcional) i `accept-invitation.dto.ts` (`code` requerit)
- **Servei** — `invitations.service.ts`

  | Mètode                    | Descripció                                                        |
  | ------------------------- | ----------------------------------------------------------------- |
  | `create(coachId, dto)`    | Genera UUID v4 com a codi, persisteix amb estat `PENDING`         |
  | `accept(clientId, code)`  | Valida estat, estableix `users.coachId`, marca `ACCEPTED`         |
  | `revoke(coachId, id)`     | Verifica autoria, marca `REVOKED`                                 |
  | `checkExpiry(invitation)` | Si `expiresAt` ha passat, marca `EXPIRED` i llança excepció       |

- **Controlador** — `invitations.controller.ts`

  | Mètode  | Ruta                        | Guard                         |
  | ------- | --------------------------- | ----------------------------- |
  | `POST`  | `/invitations`              | `JwtAuthGuard` + `CoachGuard` |
  | `POST`  | `/invitations/:code/accept` | `JwtAuthGuard`                |
  | `PATCH` | `/invitations/:id/revoke`   | `JwtAuthGuard` + `CoachGuard` |

- **Mòdul** — `invitations.module.ts` registrant servei, controlador i `PrismaModule`. Importar a `AppModule`.

---
