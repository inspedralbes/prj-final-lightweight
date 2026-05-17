## Context

The Client Dashboard (`/client/home`) contains a "History & Stats" button that navigates to `/client/history`. This page currently:
1. Shows aggregate stats (totalSessions, totalSets, totalExercises) — includes both solo and co-op sessions
2. Shows a flat list of all completed sessions sorted by date

There is **no sidebar link** for this page, and the history table makes **no distinction** between solo sessions and Friend Sessions (co-op). Additionally, there is no way to see co-op-specific stats (e.g., total sessions with friends, total co-op sets, or which partners trained together). Both participants in a co-op session share the same co-op stats in the database — each user can query their own friend-session history.

## Goals / Non-Goals

**Goals:**
- Add a permanent sidebar navigation item "Historial i Estadístiques" to the client's "Gestió" section.
- Remove the "History & Stats" button from the Client Dashboard.
- Add filter tabs (All / Solo / Friend) to the history table on `/client/history`.
- Add a dedicated "Friend Stats" card section with co-op aggregates and a per-partner breakdown.
- Add backend endpoint `GET /progress/client/friend-stats` returning co-op-only stats.

**Non-Goals:**
- Changing the existing workout UI flows (CoopSessionLobby, WorkoutRoom, etc.).
- Adding real-time sync to the history page.
- Mobile-specific views.
- New database models (all needed data exists in `LiveSession`, `LiveParticipant`, `SessionProgress`).

## Decisions

### 1. Co-op session detection via `LiveParticipant`

**Decision:** A session is classified as "Friend Session" (co-op) when `LiveSession` has at least one `LiveParticipant` record with `participantId = String(clientId)`.

**Rationale:** This is already the pattern used in `getClientOwnSessionHistory()` (co-op branch). The `LiveParticipant` table tracks all users who joined a live session. A co-op session is one where `coachId` is null and the user appears as a participant (vs. an assigned routine session).

**Alternative considered:** Check if `LiveSession.invitationCode` is not null — but this is not reliable since `invitationCode` may be set on solo sessions too. The `LiveParticipant` approach is more precise.

### 2. Per-partner aggregation

**Decision:** Return a flat list of partners: `[{ username, sessionCount }]` sorted by `sessionCount` descending.

**Rationale:** Simple and useful — shows how many sessions each partner trained with the user. No new models needed. If more detail is needed later (per-session partner breakdown), it can be added as a separate spec without breaking the current contract.

**Alternative:** Return per-session partner detail. Rejected — too much payload for v1. The per-partner aggregate is the most useful view.

### 3. Filter tabs on the frontend (All / Solo / Friend)

**Decision:** Single page with a tab switcher. All sessions shown by default, with Solo/Friend tabs that filter the table in-place.

**Rationale:** Keeps everything in one place (one route, one page mount). No URL changes needed. User context is preserved.

**Alternative:** Separate sub-routes (`/client/history/friend`). Rejected — adds routing complexity for a simple filter; the single-page tab approach is more aligned with the existing `ClientHistoryStats` page structure.

### 4. Service method naming

**Decision:** `progressService.getClientFriendStats()` on the frontend; `ProgressService.getClientFriendStats()` on the backend.

**Rationale:** Follows existing naming conventions (`getClientStats`, `getClientSessions`). Consistent across front/back.

## Data Flow

```
Frontend (ClientHistoryStats)
  └─> progressService.getClientFriendStats()
       └─> GET /progress/client/friend-stats
            └─> ProgressController.getClientFriendStats()
                 └─> ProgressService.getClientFriendStats()
                      ├─ Query LiveSession (co-op only, COMPLETED)
                      ├─ Query LiveParticipant (partner userIds)
                      ├─ Query User (resolve usernames)
                      └─ Aggregate totals + per-partner group
```

## API Design

### New Endpoint: `GET /progress/client/friend-stats`

**Guard:** `ClientGuard` (role === CLIENT)
**Auth:** JWT required

**Response:**
```json
{
  "totalCoopSessions": 5,
  "totalCoopSets": 40,
  "totalCoopExercises": 15,
  "partners": [
    { "username": "pep", "sessionCount": 3 },
    { "username": "maria", "sessionCount": 2 }
  ]
}
```

### Backend DTO: `client-friend-stats.dto.ts`

```typescript
export class ClientFriendStatsDto {
  totalCoopSessions: number;
  totalCoopSets: number;
  totalCoopExercises: number;
  partners: PartnerStatsDto[];
}

export class PartnerStatsDto {
  username: string;
  sessionCount: number;
}
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Query performance with large session history | Indexes on `LiveSession.completedAt`, `LiveParticipant.participantId` exist via Prisma defaults. No new indexes needed for v1. |
| Partner count grows large | The `partners` array is not paginated in v1. Limit to top ~50 partners; if needed later, add pagination. |
| Backwards compatibility if schema changes | All data read from existing tables — no new columns or relations required. |
| Translation keys missing in production | i18n added to all three locale files before merge. |

## Testing Strategy

**Backend (Jest):**
- `ProgressService.getClientFriendStats()` unit test:
  - Mock Prisma returning 3 co-op sessions with different partners
  - Verify `{ totalCoopSessions, totalCoopSets, totalCoopExercises }` correctly summed
  - Verify `partners` array contains correct usernames and session counts
  - Verify solo sessions (assigned, no LiveParticipant) are excluded

**Frontend (manual QA):**
1. Log in as CLIENT, go to `/client/history` from the new sidebar link.
2. Complete a solo session, complete a co-op session with a friend.
3. Verify "All" tab shows both sessions.
4. Verify "Solo" tab shows only the solo session.
5. Verify "Friend" tab shows only the co-op session.
6. Verify the Friend Stats card shows correct co-op totals and partner name.
7. Log in as the other user (friend), visit the same page, verify they also see the co-op session in their history and the partner name is correct.
8. Log in as COACH — verify `/client/history` redirects to coach dashboard (ProtectedRoute).

## i18n Keys to Add

All keys under `history.*` in ca.json, es.json, en.json:

| Key | ca | es | en |
|-----|----|----|-----|
| `history.tabs.all` | Totes | Todas | All |
| `history.tabs.solo` | Solo | Solo | Solo |
| `history.tabs.friend` | Amics | Amigos | Friends |
| `history.friendStats.title` | Estadístiques d'Amics | Estadísticas de Amigos | Friend Stats |
| `history.friendStats.totalCoopSessions` | Sessions amb amics | Sesiones con amigos | Friend sessions |
| `history.friendStats.totalCoopSets` | Sèries amb amics | Series con amigos | Friend sets |
| `history.friendStats.totalCoopExercises` | Exercicis amb amics | Ejercicios con amigos | Friend exercises |
| `history.friendStats.partnersWith` | Entrenat amb | Entrenado con | Trained with |

## Socket.IO Impact

None. This feature only reads persisted data. No new WebSocket events are added.

## Migration Plan

1. Add new backend endpoint + DTO (no migration needed — uses existing tables).
2. Add frontend service method + update `ClientHistoryStats` with tabs and friend-stats card.
3. Add sidebar nav item + remove dashboard button.
4. Add i18n keys to all three locales.
5. Run `npm run build` on both front/back to verify no type errors.
6. Manual QA pass.
7. Merge to main and deploy.