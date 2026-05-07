## 1. Frontend — Afegir data-testid al badge d'invitacions pendents

- [x] 1.1 A `src/front/src/shared/layout/Layout.tsx`, localitzar l'element del badge que es renderitza quan `pendingInvitesCount > 0` i afegir-hi `data-testid="pending-invites-badge"`
- [x] 1.2 Verificar que el badge és absent (o té comptador 0) per a `e2e_client_linked` (ja té coach) carregant l'app manualment i inspeccionant el nav

## 2. Test E2E — El coach envia una invitació i el client rep la notificació

- [x] 2.1 Crear `e2e/tests/invitations.spec.ts` amb la configuració `test.use({ freshDb: true })` a nivell de fitxer
- [x] 2.2 Implementar el test "el coach envia una invitació i el client rep la notificació en temps real": obrir dos contextos de navegador (coach + client_unlinked), el coach navega a `/coach/invite` i clica "Genera codi d'invitació", afirmar que el `[data-testid="pending-invites-badge"]` del client es fa visible amb comptador ≥ 1
- [x] 2.3 Verificar que `POST /api/invitations` retorna HTTP 201 (intercepció de resposta o mitjançant `page.request`) com a part del pas d'enviament del coach

## 3. Test E2E — El client accepta la invitació

- [x] 3.1 Implementar el test "el client accepta la invitació": iniciar sessió com a `e2e_client_unlinked`, navegar a `/clients/my-coach`, afirmar que la invitació pendent de `e2e_coach` apareix llistada, clicar "Acceptar", afirmar que la fila desapareix i que la informació del coach apareix
- [x] 3.2 Obrir un segon context com a `e2e_coach`, navegar a `/coach/clients`, afirmar que el nom d'usuari de `e2e_client_unlinked` ara és a la llista de clients
- [x] 3.3 Afirmar que `GET /api/invitations/pending-for-me` retorna un array buit després de l'acceptació (usar el fixture `request` o `page.request`)

## 4. Test E2E — El client rebutja la invitació

- [x] 4.1 Implementar el test "el client rebutja la invitació": iniciar sessió com a `e2e_client_unlinked`, navegar a `/clients/my-coach`, clicar "Declinar" sobre la invitació pendent, afirmar que la fila desapareix i que el client roman en estat desvinculat (no es mostra informació del coach)
- [x] 4.2 Obrir un segon context com a `e2e_coach`, navegar a `/coach/clients`, afirmar que `e2e_client_unlinked` NO apareix a la llista de clients
- [x] 4.3 Afirmar que `GET /api/invitations/pending-for-me` retorna un array buit després del rebuig

## 5. Test E2E — Control d'accés basat en rol i casos límit

- [x] 5.1 Afegir un test que afirmi que `POST /api/invitations` retorna HTTP 401 quan es crida sense JWT (usar el fixture `request` directament)
- [x] 5.2 Afegir un test que afirmi que `POST /api/invitations` retorna HTTP 403 quan es crida amb un JWT de CLIENT (iniciar sessió com a `e2e_client_linked` i atacar l'endpoint directament)
- [x] 5.3 Afegir un test que afirmi que el badge mostra 0 (o és absent) per a `e2e_client_linked` que ja té coach i cap invitació pendent

## 6. Tests / Verificació

- [x] 6.1 Executar `cd e2e && npm run test:e2e:browser` amb el backend (`E2E_TESTING=true`) i el frontend en execució — confirmar que tots els tests de `invitations.spec.ts` passen (verd)
- [x] 6.2 Executar `cd src/front && npm run lint && npm run build` — confirmar que no hi ha errors de TypeScript ni de lint després d'afegir el `data-testid`
- [x] 6.3 Afegir entrades de QA manual a `doc/Proves_usuari.md` que cobreixin: flux d'enviament d'invitació, el client rep el badge de notificació, flux d'acceptació, flux de rebuig
- [x] 6.4 Confirmar que `npx playwright show-report` mostra traces/captures de pantalla per a qualsevol fallada durant l'execució local de desenvolupament
