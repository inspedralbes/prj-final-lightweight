Feedback Usuari:

Bug1:

- Durant l'execució d'una rutina, si es va cap a una altra finestra es perd el progrés

Millores:

- Codi del friend session que sigui més curt
- La web de client es veu una mica buida i ha de ser més interactiu, per ex: "Hoy te toca esta rutina", etc.

Coses bones:

- El tema del idioma, la videotrucada, el chat, el disseny de la pàgina.

---

## Smoke Check post-deploy

Verificació mínima a executar després de cada desplegament a producció:

| #   | Verificació                                     | Resultat esperat                            |
| --- | ----------------------------------------------- | ------------------------------------------- |
| 1   | `curl -I https://<domini>/`                     | `200 OK` (Nginx serveix el front-end)       |
| 2   | `curl -I https://<domini>/api/exercises`        | `200 OK` (endpoint públic del backend)      |
| 3   | Accedir a `https://<domini>/login` al navegador | Formulari de login visible                  |
| 4   | Registrar un compte COACH i fer login           | Redirigeix al dashboard de coach            |
| 5   | Registrar un compte CLIENT i acceptar invitació | Client veu les rutines assignades           |
| 6   | Iniciar sessió d'entrenament en solitari        | Comptador i resum final funcionen           |
| 7   | Obrir xat P2P entre coach i client              | Missatges arriben en temps real (WebSocket) |

Si alguna verificació falla, revisar els logs: `docker compose -f docker-compose.prod.yml logs --tail=50 <servei>`.

---

## E2E Test Reference

Per a la planificació de cobertura E2E, veure: `doc/E2E_critical_flows.md`

---

## E2E – datos de prueba (LW-440)

Verificación manual del módulo de testing y del seed determinista. Solo aplicable en local — **nunca** en producción.

> ⚠️ Antes de empezar: confirma que el secret `ENV_FILE` de la GitHub Action `deploy.yml` **no contiene** `E2E_TESTING=true`. El back tiene una segunda guarda (`NODE_ENV=production` desactiva el módulo igual), pero el flag debe quedarse apagado en cualquier entorno tipo prod.

| #   | Paso | Resultado esperado |
| --- | --- | --- |
| 1   | Arrancar la DB (`docker compose up -d lw-postgres`) y el back con el flag: `cd src/back && E2E_TESTING=true npm run start:dev` | Logs de NestJS no muestran error; aparece `Mapped {/testing/reset, POST}` y similares para `/seed` y `/login` |
| 2   | Aplicar el seed: `cd src/back && npx prisma db seed` | Salida `[seed] E2E seed applied: { users: [...3 usernames], routines: ['e2e_routine_basic'], invitations: 1 }` |
| 3   | Re-aplicar el seed por segunda vez (`npx prisma db seed`) | Termina con código 0; en Adminer (`http://localhost:8081`), `SELECT id, username FROM users WHERE username LIKE 'e2e_%'` devuelve los **mismos 3 IDs** que en el paso 2 |
| 4   | `curl -X POST http://localhost:3000/testing/login -H "Content-Type: application/json" -d '{"username":"e2e_coach"}'` | HTTP 200, body `{ access_token: "<jwt>", user: { username: "e2e_coach", role: "COACH", ... } }` |
| 5   | `curl -X POST http://localhost:3000/testing/login -H "Content-Type: application/json" -d '{"username":"admin"}'` | HTTP 400, mensaje incluye `"username must match /^e2e_[a-z_]+$/"` |
| 6   | `curl -X POST http://localhost:3000/testing/reset` | HTTP 200, `durationMs < 2000`, `seeded.users` contiene los 3 usernames `e2e_*` |
| 7   | Reiniciar el back **sin** el flag (`npm run start:dev`), repetir `curl -X POST http://localhost:3000/testing/reset` | HTTP 404 (el módulo no se ha cargado) |
| 8   | Build prod + arrancar con `NODE_ENV=production E2E_TESTING=true npm run start:prod` y `curl -X POST http://localhost:3000/testing/reset` | HTTP 404 — la doble guarda funciona |

Si algún paso falla, revisar `docker compose logs lw-backend` y comprobar que `E2E_TESTING` se está leyendo correctamente (`echo $E2E_TESTING` antes de `npm run start:dev`).

---

## E2E – Flux d'invitacions i notificacions (LW-444)

Verificació manual del flux d'invitació coach→client i la notificació en temps real. Requereix el harness E2E actiu (`E2E_TESTING=true`, seed aplicat, front en `:5173`).

| #   | Pas | Resultat esperat |
| --- | --- | --- |
| 1   | Executa `cd e2e && npm run test:e2e:browser` amb back i front en marxa | Tots els tests de `invitations.spec.ts` passen (verd); `1 passed` al smoke de referència |
| 2   | Coach inicia sessió (usuari qualsevol), va a `/clients`, clica "Convidar client", introdueix el nom d'un client sense coach i clica "Enviar invitació" | El modal mostra l'estat d'èxit; el client rep el badge d'invitació pendent al nav (incrementa sense recarregar) |
| 3   | Client navega a `/clients/invitations` | L'entrada de la invitació pendent del coach apareix a la llista amb el nom del coach |
| 4   | Client clica "Acceptar" | La invitació desapareix de la llista; la pàgina mostra la informació del coach vinculat |
| 5   | Coach torna a `/clients` | El nom d'usuari del client apareix a la llista de clients |
| 6   | Repeteix els passos 2–3 amb un client diferent; client clica "Rebutjar" | La invitació desapareix; el client roman desvinculat (sense info de coach); el coach no el veu a `/clients` |
| 7   | Comprova el badge: `e2e_client_linked` (ja té coach) ha de tenir badge 0 a qualsevol pàgina del nav | Cap badge visible per a clients amb coach assignat |
