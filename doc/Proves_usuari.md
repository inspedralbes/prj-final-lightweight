# Proves d'Usuari — LightWeight

Manual QA checklist for production smoke tests.

---

## Progress API (LW-258)

### Pre-requisits
- Backend running at `http://localhost:3000` (or via Docker Compose)
- At least one coach and one client user registered and linked via invitation
- At least one completed workout session (solo or co-op)

### Proves

#### 1. Client: historial de sessions pròpies
```
GET /api/progress/client/sessions
Authorization: Bearer <client_token>
```
- **Resultat esperat**: HTTP 200 amb `{ sessions: [...] }`
- La sessió completada apareix a la llista amb `completedAt` informat
- Les sessions en estat PENDING o ACTIVE NO apareixen
- Sense token → HTTP 401
- Token de coach → HTTP 403

#### 2. Client: estadístiques agregades
```
GET /api/progress/client/stats
Authorization: Bearer <client_token>
```
- **Resultat esperat**: HTTP 200 amb `{ totalSessions, totalSets, totalExercises }`
- `totalSessions` incrementa cada cop que es completa una sessió
- `totalSets` i `totalExercises` sumen els valors enviats al completar la sessió
- Client sense sessions → `{ totalSessions: 0, totalSets: 0, totalExercises: 0 }`

#### 3. Coach: llista de clients amb activitat
```
GET /api/progress/coach/clients
Authorization: Bearer <coach_token>
```
- **Resultat esperat**: HTTP 200 amb array de `{ clientId, username, lastSessionAt, totalSessions }`
- Cada client del coach apareix a la llista
- `lastSessionAt` és la data de l'última sessió completada (null si no n'hi ha cap)
- Sense token → HTTP 401
- Token de client → HTTP 403

#### 4. Coach: historial d'un client concret
```
GET /api/progress/coach/client/:clientId
Authorization: Bearer <coach_token>
```
- **Resultat esperat**: HTTP 200 amb array de `{ id, routineName, completedAt, completionPercentage, completedSets }`
- Conté les sessions completades del client indicat
- `clientId` d'un client aliè al coach → HTTP 404
- Sense token → HTTP 401
- Token de client → HTTP 403

#### 5. Persistència de mètriques en completar sessió
Al completar una sessió (POST `/api/session/:code/status`):
```json
{
  "status": "COMPLETED",
  "completionPercentage": 85,
  "completedSets": 12,
  "completedExercises": 4
}
```
- **Resultat esperat**: La sessió es desa amb els camps `completionPercentage=85`, `completedSets=12`, `completedExercises=4`
- Verificar via `GET /api/progress/client/sessions` que els valors apareixen correctament a la resposta

---

## Tests E2E en CI — Com interpretar el check de GitHub Actions (LW-445)

### Quan obre un PR

Cada PR contra `main` dispara automàticament el workflow **"E2E Tests (Playwright)"**.
A la pàgina del PR, a la secció **Checks**, trobaràs el check `e2e / playwright`.

| Estat | Significat |
|-------|------------|
| ✅ `success` | Tots els tests E2E han passat. El PR pot fer-se merge. |
| ❌ `failure` | Algun test ha fallat. El merge queda bloquejat fins que es corregeixi. |
| 🟡 `in_progress` | El workflow encara s'està executant (~5–8 min). |

### Com accedir als artefactes en cas de fallo

1. Fes clic a **Details** al costat del check `e2e / playwright` en fallida.
2. A la pàgina del run, fes clic a la pestanya **Summary**.
3. A la secció **Artifacts**, descarrega `e2e-report-<run_id>`.
4. Descomprimeix l'arxiu i obre el report localment:
   ```bash
   npx playwright show-report ruta/a/playwright-report
   ```
5. El report mostra cada test fallat amb la seva **traça** (trace), **captura de pantalla** i **vídeo** del moment del fallo.

### Notes importants

- Els artefactes s'eliminen automàticament als **7 dies** — descarrega'ls aviat si els necessites.
- Els tests amb comportament inestable (*flaky*) es reintenten automàticament fins a 2 vegades en CI.
  Si un test falla constantment, obre una issue i assigna-la a la pròxima sprint.
- **Mai activar `E2E_TESTING=true` en producció** — aquest flag habilita endpoints que esborra dades.

---

## LW-270 — Web Client: Vista de Historial y Estadísticas

### Prerequisits
- Stack en marxa: `docker compose up`
- Usuari CLIENT de prova amb almenys una sessió completada

### Escenaris

#### 1. Navegació al historial
- Inicia sessió com a CLIENT
- Al dashboard (`/client-home`), verifica que apareix el botó "Historial i Estadístiques" a la capçalera
- Fes clic al botó → confirma que navega a `/client/history` sense recàrrega completa de la pàgina

#### 2. Visualització de l'historial
- A `/client/history`, confirma que:
  - Els comptadors d'estadístiques mostren valors reals (sessions, sèries, exercicis)
  - La taula mostra les sessions completades ordenades per data descendent
  - Cada fila inclou: nom de la rutina, data i % completat
  - Si no hi ha sessions, apareix el missatge d'estat buit

#### 3. Sessió completada apareix a l'historial
- Completa un entrenament en solitari des de `/client-home`
- Torna a `/client/history`
- Confirma que la nova sessió apareix com a primera fila amb data i % correctes
- Confirma que el comptador "Sessions completades" s'ha incrementat en 1

#### 4. Control d'accés
- Tanca sessió i navega directament a `/client/history` → ha de redirigir al login
- Inicia sessió com a COACH i navega a `/client/history` → ha de redirigir al dashboard del coach

#### 5. Botó Tornar
- A `/client/history`, fes clic al botó "Volver" → confirma que torna a `/client-home`

