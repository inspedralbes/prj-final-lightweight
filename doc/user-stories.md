# Tareas — Sistema de invitaciones coach → cliente

**Épica**: Gestión de relaciones coach-cliente
**Actualizado**: 2026-02-24

---

## TASK-01 — BBDD: schema y migración

**Tipo**: Base de datos
**Dependencias**: —

Actualizar `prisma/schema.prisma`:

- Eliminar el campo `invitationCode` del modelo `User`
- Añadir el enum `InvitationStatus` (`PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED`)
- Añadir el modelo `Invitation`: `id`, `coachId` (FK), `clientId` (FK nullable), `code` (unique), `status`, `expiresAt` (nullable), `createdAt`, `acceptedAt` (nullable)

Ejecutar `prisma migrate dev` para generar y aplicar la migración.

---

## TASK-02 — Backend: módulo de invitaciones

**Tipo**: Backend
**Dependencias**: TASK-01

Crear `src/invitations/` con:

- **DTOs** — `create-invitation.dto.ts` (`expiresAt` opcional) y `accept-invitation.dto.ts` (`code` requerido)
- **Servicio** — `invitations.service.ts`

  | Método                    | Descripción                                                 |
  | ------------------------- | ----------------------------------------------------------- |
  | `create(coachId, dto)`    | Genera UUID v4 como código, persiste con estado `PENDING`   |
  | `accept(clientId, code)`  | Valida estado, establece `users.coachId`, marca `ACCEPTED`  |
  | `revoke(coachId, id)`     | Verifica autoría, marca `REVOKED`                           |
  | `checkExpiry(invitation)` | Si `expiresAt` ha pasado, marca `EXPIRED` y lanza excepción |

- **Controlador** — `invitations.controller.ts`

  | Método  | Ruta                        | Guard                         |
  | ------- | --------------------------- | ----------------------------- |
  | `POST`  | `/invitations`              | `JwtAuthGuard` + `CoachGuard` |
  | `POST`  | `/invitations/:code/accept` | `JwtAuthGuard`                |
  | `PATCH` | `/invitations/:id/revoke`   | `JwtAuthGuard` + `CoachGuard` |

- **Módulo** — `invitations.module.ts` registrando servicio, controlador y `PrismaModule`. Importar en `AppModule`.

---
