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
