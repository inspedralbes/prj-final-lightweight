## Per què

El flux d'invitacions (el coach envia una invitació, el client l'accepta o la rebutja) i la notificació en temps real que l'acompanya són fonamentals per a la relació coach-client, però no tenen cap cobertura E2E automatitzada. LW-444 omple aquest buit afegint una suite de tests Playwright que exercita el recorregut complet de l'usuari, incloent-hi l'event Socket.IO `coach-invitation` que lliura la notificació al client.

## Què canvia

- Nou fitxer de tests Playwright `e2e/tests/invitations.spec.ts` que cobreix quatre escenaris: enviar invitació, rebre notificació, acceptar invitació, rebutjar invitació.
- Reutilització dels fixtures E2E existents (`loginAs`, `freshDb`, `resetDatabase`) — no cal cap nou fixture.
- El seed ja proporciona `e2e_client_unlinked` (encara no vinculat al coach) i una `Invitation` pendent (`E2E-INVITE-001`) — els tests s'hi recolzaran, més l'endpoint de reset per restaurar l'estat entre execucions.
- No calen canvis al backend ni al frontend; els endpoints REST `/api/invitations` existents i l'event Socket.IO `coach-invitation` ja suporten els fluxos provats.

## Capacitats

### Capacitats noves

- `e2e-invitations-notifications`: Suite de tests E2E amb Playwright que cobreix el flux d'enviament/acceptació/rebuig d'invitacions i el lliurament de la notificació en temps real via Socket.IO.

### Capacitats modificades

- `e2e-testing`: L'especificació existent creix amb un nou fitxer de tests a `e2e/tests/`. No hi ha canvis de requisits — l'espai de treball, els fixtures i el setup global ja satisfan les necessitats del harness. És una addició d'implementació, no un canvi de comportament a nivell d'spec.

## Impacte

- **Mòduls del backend**: `invitations` (InvitationsController, InvitationsService) — lectura/escriptura via endpoints REST existents. `events` (EventsGateway) — emissió de `coach-invitation` verificada a través de la connexió WebSocket del navegador a Playwright.
- **Features del frontend**: `notifications` (NotificationContext, NotificationCenter) — objectiu d'afirmació per al badge/comptador de notificació rebuda. Pàgines de `coach` i `client` — la UI d'enviament d'invitació (costat coach) i la UI d'acceptació/rebuig (costat client) són els objectius d'interacció.
- **Workspace E2E**: nou fitxer `e2e/tests/invitations.spec.ts`; cap canvi a `playwright.config.ts`, fixtures ni global setup.
- **Nota de testing**: Els tests utilitzen dos contextos de navegador concurrents (un autenticat com a `e2e_coach`, un altre com a `e2e_client_unlinked`) per validar el flux bidireccional complet. El fixture `freshDb` reinicia la BD abans de cada escenari per garantir l'aïllament. El lliurament de l'event Socket.IO es verifica esperant un canvi al DOM del context del client (increment del badge de notificació), no interceptant directament el WebSocket.
- **Jira**: LW-444 (Tasca) al projecte LightWeight.
