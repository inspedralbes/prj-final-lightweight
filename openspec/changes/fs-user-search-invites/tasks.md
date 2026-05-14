# Tasques d'Implementació: friend-session-user-search-invites

## 1. Esquema de Base de Dades & Migracions

- [x] 1.1 Afegir model `FriendInvitation` i enum `FriendInvitationStatus` a `src/back/prisma/schema.prisma`
- [x] 1.2 Crear migració Prisma: `npx prisma migrate dev --name add_friend_invitations`
- [x] 1.3 Verificar migració amb `npx prisma validate`
- [~] 1.4 Executar script de seed si es necessiten dades de test per desenvolupament (omès, dades de test creades manualment durant el desenvolupament)

## 2. Backend: Endpoint de Cerca d'Usuaris

- [x] 2.1 Crear `src/back/src/users/users.service.ts` amb mètode `searchOnlineUsers(query: string, currentUserId: number)`
- [x] 2.2 Crear `src/back/src/users/users.controller.ts` amb endpoint `GET /api/users/search?q=<query>`
- [x] 2.3 Implementar rastreig d'usuaris connectats Socket.IO (aprofitar EventsGateway existent per mantenir un Set o llista en memòria de userIds connectats)
- [x] 2.4 Afegir `@UseGuards(JwtAuthGuard)` basat en rols a l'endpoint de cerca
- [x] 2.5 Gestionar casos límit: validació de longitud de consulta (min 2 caràcters), límit de resultats (max 10), filtratge sense distinció de majúscules/minúscules
- [x] 2.6 Crear DTO `src/back/src/users/dto/user-search.response.ts` amb `id`, `username`, `role`

## 3. Backend: Mòdul d'Invitacions d'Amics

- [x] 3.1 Crear `src/back/src/friend-invitations/friend-invitations.module.ts`
- [x] 3.2 Crear `src/back/src/friend-invitations/friend-invitations.service.ts` amb mètodes:
  - `createInvitation(inviterId, inviteeId)` — comprovar usuari en línia, prevenir duplicats, establir expiració de 5 min
  - `getMyPendingInvitations(userId)` — retornar invitacions PENDING, auto-expirar les estancades
  - `acceptInvitation(invitationId, userId)` — marcar com ACCEPTED, retornar sessionCode
  - `rejectInvitation(invitationId, userId)` — marcar com REJECTED
  - `expireOldInvitations()` — tasca de fons per marcar invitacions amb expiresAt <= now() com EXPIRED
- [x] 3.3 Crear `src/back/src/friend-invitations/friend-invitations.controller.ts` amb:
  - `POST /api/friend-invitations/send` — crear invitació
  - `GET /api/friend-invitations/pending` — obtenir invitacions pendents
  - `PATCH /api/friend-invitations/:id/accept` — acceptar invitació
  - `PATCH /api/friend-invitations/:id/reject` — rebutjar invitació
- [x] 3.4 Crear DTOs:
  - `src/back/src/friend-invitations/dto/create-friend-invitation.dto.ts`
  - `src/back/src/friend-invitations/dto/friend-invitation.response.ts`
- [x] 3.5 Registrar `FriendInvitationsModule` en `src/back/src/app.module.ts`
- [x] 3.6 Afegir tasca `@Cron()` en FriendInvitationsService o CronService dedicat per expirar invitacions antigues cada minut

## 4. Backend: Esdeveniments Socket.IO (EventsGateway)

- [x] 4.1 Afegir gestors d'esdeveniments a `src/back/src/events/events.gateway.ts`:
  - `friend-invite:notify` — emetre a `user:{inviteeId}` quan s'envia invitació
  - `friend-invite:accepted` — emetre a `user:{inviterId}` quan s'accepta invitació
  - `friend-invite:rejected` — emetre a `user:{inviterId}` quan es rebutja invitació
- [x] 4.2 Definir interfícies de payload d'esdeveniments en `src/back/src/friend-invitations/interfaces/` o inline al gateway
- [x] 4.3 Assegurar que el rastreig de connexió Socket.IO manté un conjunt/mapa viu de `userId → llista de sockets`
- [x] 4.4 Gestionar fallades de broadcast Socket.IO amb gràcia (registrar error però no revertir transacció de base de dades)

## 5. Backend: Gestió d'Errors HTTP & Codis d'Estat

- [x] 5.1 Afegir gestors HttpException per:
  - 400: Consulta massa curta, usuari offline, auto-invitació, ja té invitació pendent
  - 401: No autoritzat (JWT faltant)
  - 403: Desajustament d'invitant (intentant acceptar/rebutjar invitació per un altre usuari)
  - 409: Invitació pendent duplicada
  - 410: Invitació expirada
- [x] 5.2 Provar respostes d'error coincideixen amb escenaris de spec

## 6. Backend: Testing (Jest)

- [x] 6.1 Crear `src/back/src/users/users.service.spec.ts` amb tests:
  - Cerca retorna només usuaris en línia
  - Cerca exclou usuari actual
  - Cerca requereix min 2 caràcters
  - Resultats de cerca limitats a 10
  - Filtratge sense distinció de majúscules/minúscules funciona
- [x] 6.2 Crear `src/back/src/friend-invitations/friend-invitations.service.spec.ts` amb tests:
  - Crear invitació té èxit amb usuari en línia
  - Invitació a si mateix llança BadRequestException
  - Invitació pendent duplicada és rebutjada (409)
  - Lògica d'auto-expirar marca PENDING → EXPIRED (handleExpireInvitationsJob)
  - Acceptar invitació actualitza estat i retorna roomId
  - Rebutjar invitació actualitza estat
  - Obtenir invitacions pendents retorna llista correcta
  - Events socket emesos correctament en acceptar/rebutjar
- [x] 6.3 Mock instància de servidor `socket.io`, `PrismaService`, `PresenceService` i `EventsGateway` amb vi.fn()
- [x] 6.4 Executar `npm test` — 77/80 tests passen; 3 fallades pre-existents (testing.service x2, invitations.service x1) no relacionades amb aquesta funcionalitat

## 6b. Backend: Endpoint addicional (afegit durant implementació)

- [x] 6b.1 Afegir endpoint `GET /api/friend-invitations/sent` a `friend-invitations.controller.ts`
- [x] 6b.2 Actualitzar `getSentInvitations()` al service per retornar només PENDING, incloure `inviter`+`invitee`, i expirar invitacions obsoletes prèviament

## 7. Backend: Build & Lint

- [x] 7.1 Executar `npm run lint` en `src/back/` i corregir qualsevol error eslint
- [x] 7.2 Executar `npm run build` en `src/back/` i verificar sense errors TypeScript

## 8. Frontend: Estructura de Característica

- [x] 8.1 Crear `src/front/src/features/workout/pages/FriendSessionLobby.tsx` com a pàgina principal
- [x] 8.2 Crear `src/front/src/features/workout/components/UserSearchModal.tsx` per input de cerca + resultats
- [x] 8.3 Crear `src/front/src/features/workout/components/PendingInvitationCard.tsx` per visualitzar invitacions rebudes
- [x] 8.4 Crear `src/front/src/features/workout/services/friendInvitationService.ts` amb crides axios als endpoints backend

## 9. Frontend: Component de Cerca d'Usuaris

- [x] 9.1 Implementar `UserSearchModal` amb:
  - Camp d'input de text amb validació mínima de 2 caràcters
  - Mostrar resultats en temps real mentre l'usuari escriu (debounce 300ms)
  - Mostrar avatar/placeholder d'usuari, nom d'usuari, rol
  - Botó "Invite" per resultat
  - Estat de càrrega durant crida API
  - Missatge d'error si la cerca falla
- [x] 9.2 Cridar `friendInvitationService.searchUsers(query)` en canvi d'input
- [x] 9.3 Implementar debounce utilitzant `useCallback` o funció d'utilitat
- [x] 9.4 Gestionar casos límit: consulta buida, sense resultats, error API

## 10. Frontend: Visualització d'Invitacions Pendents

- [x] 10.1 Implementar `PendingInvitationCard` per mostrar:
  - Nom d'usuari de l'invitant
  - Temps de creació d'invitació
  - Botons Acceptar i Rebutjar
  - Auto-amagar si l'invitació expira (compte enrere de 5 minuts o polling)
- [x] 10.2 Mostrar temporitzador d'expiració o compte enrere visual
- [x] 10.3 Gestionar canvis d'estat d'invitació optimísticament (amagar targeta abans que el servidor confirmi)

## 11. Frontend: Pàgina FriendSessionLobby

- [x] 11.1 Crear component de pàgina principal que combina:
  - Modal de cerca d'usuaris (obert per defecte o via botó)
  - Llista d'invitacions pendents (obtinguda en muntatge)
  - Llista de sessions acceptades (lògica d'auto-unió)
- [x] 11.2 Obtenir invitacions pendents en càrrega de pàgina: `friendInvitationService.getPendingInvitations()`
- [x] 11.3 Configurar polling o listener Socket.IO per refrescar invitacions pendents cada 10 segons
- [x] 11.4 En acceptar invitació: extreure sessionCode i cridar `workoutService.joinSession(sessionCode)`
- [x] 11.5 Gestionar accés basat en rols: assegurar ruta és només CLIENT

## 12. Frontend: Integració amb App.tsx

- [x] 12.1 Afegir listeners Socket.IO en muntatge global `App.tsx` per:
  - `friend-invite:notify` → mostrar toast, afegir a NotificationContext
  - `friend-invite:accepted` → mostrar toast "Usuari va acceptar la teva invitació"
  - `friend-invite:rejected` → mostrar toast "Usuari va declinar la teva invitació"
- [x] 12.2 Afegir ruta `/friend-session` a `App.tsx` dins `<ProtectedRoute allowedRoles={["CLIENT"]}>`
- [x] 12.3 Afegir enllaç de navegació de barra lateral en `src/front/src/shared/layout/Layout.tsx` (només visible per rol CLIENT)

## 13. Frontend: Serveis & Hooks

- [x] 13.1 Implementar `friendInvitationService.ts`:
  - `searchUsers(query: string): Promise<UserSearchResult[]>`
  - `sendInvitation(inviteeId: number): Promise<FriendInvitation>`
  - `getPendingInvitations(): Promise<FriendInvitation[]>`
  - `acceptInvitation(invitationId: number): Promise<{ sessionCode: string }>`
  - `rejectInvitation(invitationId: number): Promise<void>`
- [x] 13.2 Utilitzar wrapper `api` de `@/shared/utils/api` per gestió de token JWT
- [x] 13.3 Definir interfícies TypeScript en fitxer `types.ts` dins el servei
- [x] 13.4 Gestionar errors axios i propagar missatges d'error significatius

## 14. Frontend: Estil & UX

- [x] 14.1 Aplicar Tailwind CSS a tots els components (sense estils inline)
- [x] 14.2 Utilitzar icones Lucide per botons (e.g., `<Check>` per acceptar, `<X>` per rebutjar)
- [x] 14.3 Aplicar suport de mode fosc via `ThemeContext` (comprovar `className="dark:..."`)
- [x] 14.4 Assegurar disseny responsiu en mòbil (test en viewport petit)
- [x] 14.5 Afegir esquelet de càrrega o spinner durant crides API

## 15. Frontend: Integració i18n

- [x] 15.1 Afegir claus de traducció a `src/front/src/i18n/locales/ca.json`
- [x] 15.2 Afegir mateixes claus a `src/front/src/i18n/locales/es.json` amb traduccions espanyoles
- [x] 15.3 Afegir mateixes claus a `src/front/src/i18n/locales/en.json` amb traduccions angleses
- [x] 15.4 Utilitzar hook `useTranslation()` en components per consumir claus

## 16. Frontend: Build & Lint

- [x] 16.1 Executar `npm run lint` en `src/front/` i corregir errors eslint
- [x] 16.2 Executar `npm run build` en `src/front/` i verificar sense errors TypeScript o Vite
- [x] 16.3 Executar `tsc --noEmit` per verificar comprovació de tipus

## 17. Variables d'Entorn

- [x] 17.1 Afegir `FRIEND_INVITATION_TTL_SECONDS=300` a `src/back/.env.example` i root `.env.example`
- [x] 17.2 Llegir var d'entorn en `src/back/src/friend-invitations/friend-invitations.service.ts` (per defecte 300 si no establert)
- [x] 17.3 Afegir nota a plantilla de comentari GitHub Actions ENV_FILE per `FRIEND_INVITATION_TTL_SECONDS`

## 18. Documentació & QA

- [x] 18.1 Passos QA manuals verificats en navegadors separats (usuaris bryan i amin):
  - ✓ A cerca B i envia invitació → apareix a secció "Invitaciones enviadas" immediatament
  - ✓ B rep notificació toast i invitació apareix a "Invitaciones pendentes"
  - ✓ B accepta invitació → ambdós naveguen a la sala
  - ✓ Si B rebutja → A rep toast amb nom de B i la targeta desapareix
  - ✓ Botó "Te invitó" deshabilitat al modal si l'altre usuari ja t'ha invitat
  - ✓ Timeout i expiració funcionen (cron cada minut)
- [ ] 18.2 Documentar nous esdeveniments Socket.IO en design.md d'aquest spec (ja fet, verificar claredat)
- [ ] 18.3 Afegir nota a README.md o AGENTS.md si hi ha nous patrons arquitectònics

## 20. Correccions Addicionals

- [x] 20.1 Corregir errors de sintaxi en `CoopSessionLobby.tsx` (imports faltants, noms de funcions corruptes)
- [x] 20.2 Corregir error de context Router amb `useNavigate()` reestructurant `App.tsx` en components separats
- [x] 20.3 Verificar build frontend: `npm run build` té èxit sense errors TypeScript

## 21. Millores d'UX i Correccions Post-QA

- [x] 21.1 Alinear estil visual de `UserSearchModal` i `PendingInvitationCard` amb la resta de la web (zinc-900/800/950, rounded-lg, gray-400 en lloc de slate)
- [x] 21.2 Eliminar texts hardcodejats dels components i substituir per claus `t()` d'i18n (es/en/ca)
- [x] 21.3 Afegir claus i18n faltants: `searchLabel`, `searchPlaceholder`, `inviteButton`, `invitedButton`, `rejectButton`, `acceptButton`, `pendingInvite`, `inviteFrom`, `searchTitle`, `searchHint`, `loadingResults`, `noResults`, `sentTitle`, `sentWaiting`, `sentPending`, `inviteRejectedByUser`, `hasInvitedYou`
- [x] 21.4 Ampliar `CoopSessionLobby` per mostrar secció "Invitacions enviades" (on sóc invitador) separada de "Invitacions rebudes"
- [x] 21.5 Afegir `silentRefresh()` (polling cada 15s sense spinner) i `refreshSentInvitations()` (refresc immediat post-enviament)
- [x] 21.6 Afegir listener `friend-invite:rejected` a `App.tsx` (reemès com `CustomEvent` al `window`) i a `CoopSessionLobby` per eliminar targeta enviada i mostrar toast
- [x] 21.7 Passar `pendingFromIds` al `UserSearchModal`: deshabilitar botó "Invitar" i mostrar "Te invitó" si l'usuari ja t'ha enviat invitació (evita 409 i confusió d'UX)
- [x] 21.8 Corregir ruta `/workout/:id` no registrada a `App.tsx` → pantalla en blanc en iniciar rutina des de `ClientDashboard`

