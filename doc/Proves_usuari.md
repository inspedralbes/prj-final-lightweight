# Proves d'Usuari — LightWeight

Llista de verificació de QA manual per a proves de producció i smoke tests.

---

## Autenticació (LW-441)

### Registre d'usuari nou
1. Navega a `/register`.
2. Omple nom d'usuari, correu electrònic, contrasenya i confirmació.
3. **Esperat**: redirigeix a `/login` i apareix el toast "Compte creat correctament".
4. Inicia sessió amb les credencials creades.
5. **Esperat**: redirigeix al dashboard correcte (COACH → `/dashboard`, CLIENT → `/client-home`).

### Registre amb dades invàlides
1. Envia el formulari amb correu electrònic invàlid (p. ex. "notanemail").
   - **Esperat**: la validació HTML5 evita l'enviament, el camp de correu es marca com a invàlid.
2. Envia el formulari amb contrasenyes no coincidents.
   - **Esperat**: apareix el missatge "Les contrasenyes no coincideixen".
3. Intenta registrar-se amb un nom d'usuari ja existent.
   - **Esperat**: apareix el missatge "Aquest usuari ja existeix".

### Login
1. Navega a `/login` i entra credencials correctes d'un COACH.
   - **Esperat**: redirigeix a `/dashboard`, toast "Sessió iniciada correctament", token a localStorage.
2. Entra credencials correctes d'un CLIENT.
   - **Esperat**: redirigeix a `/client-home`.
3. Entra una contrasenya incorrecta.
   - **Esperat**: apareix l'alerta "Usuari o contrasenya invàlids", romanem a `/login`, cap token emmagatzemat.
4. Prem Enter al camp de contrasenya en lloc de fer clic al botó.
   - **Esperat**: el formulari s'envia igual que amb el botó.

### Logout
1. Inicia sessió i fes clic al botó "Tancar sessió" de la barra lateral.
   - **Esperat**: redirigeix a `/login`, localStorage buit.
2. Intenta navegar directament a `/dashboard` després de logout.
   - **Esperat**: redirigeix a `/login`.

### Persistència de sessió
1. Inicia sessió i recarrega la pàgina (F5).
   - **Esperat**: romanem al dashboard sense necessitat de tornar a iniciar sessió.
2. Inicia sessió, navega entre `/dashboard` i `/clients`, recarrega en cada pàgina.
   - **Esperat**: el token a localStorage no canvia i no hi ha redirects inesperats.

### Restricció de sessió única per usuari (LW-460)
1. Obre dos navegadors (o dos perfils de navegador independents).
2. Inicia sessió amb el **mateix compte** al primer navegador.
   - **Esperat**: login exitós, redirigeix al dashboard.
3. Intenta iniciar sessió amb el **mateix compte** al segon navegador.
   - **Esperat**: apareix un missatge d'error indicant que el compte ja té una sessió activa; l'usuari roman a `/login`.
4. Tanca la sessió al primer navegador (botó "Tancar sessió").
   - **Esperat**: redirigeix a `/login`, localStorage buit.
5. Intenta iniciar sessió de nou al segon navegador.
   - **Esperat**: login exitós, redirigeix al dashboard.
6. Inicia sessió al primer navegador. Tanca la pestanya (sense fer logout explícit) i espera ~5 segons.
   - **Esperat**: el segon navegador pot iniciar sessió correctament (el beacon logout ha alliberat la sessió).
7. Inicia sessió i fes logout. Intenta cridar `GET /api/auth/profile` amb el token capturat abans del logout (p. ex. des de les DevTools → Network → copia el Bearer token).
   - **Esperat**: la crida retorna `401 Unauthorized`.

---

## API de Progrés (LW-258)

### Prerequisits
- Backend en marxa a `http://localhost:3000` (o via Docker Compose)
- Almenys un coach i un client registrats i vinculats via invitació
- Almenys una sessió d'entrenament completada (en solitari o cooperativa)

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

## Progrés de clients (LW-279)

### Llista d'activitat de clients
1. Inicia sessió com a entrenador.
2. Fes clic a "Progrés de clients" a la barra lateral.
3. **Esperat**: s'obre `/clients/progress` amb una taula de clients. Per a cada client, es mostra el nom d'usuari, la data de l'última sessió completada (o "—" si no n'hi ha cap) i el total de sessions.
4. **Cas buit**: si cap client té sessions completades, es mostra el missatge "Cap sessió completada".

### Navegació al detall d'un client
1. Des de `/clients/progress`, fes clic sobre qualsevol fila de client.
2. **Esperat**: navega a `/clients/progress/:clientId` i es carrega la pàgina de detall.
3. Fes clic a "Tornar a la llista".
4. **Esperat**: torna a `/clients/progress`.

### Historial de sessions i estadístiques
1. A la pàgina de detall d'un client que té sessions completades:
   - **Esperat**: tres targetes d'estadístiques (Sessions totals, Sèries totals, Exercicis totals) amb valors reals.
   - **Esperat**: taula d'historial amb columnes Rutina, Data, % completat i Sèries.
   - Una sessió amb `completionPercentage` null ha de mostrar "0%" a la taula.

### Gràfic de barres
1. A la pàgina de detall d'un client amb sessions:
   - **Esperat**: apareix un gràfic de barres taronja (fins a 10 barres). L'alçada de cada barra és proporcional al % completat.
   - Una barra amb 0% ha de tenir alçada mínima (pràcticament plana).
2. Per a un client sense sessions, el gràfic no s'ha de renderitzar.

### Control d'accés
1. Tanca la sessió i accedeix directament a `/clients/progress`.
   - **Esperat**: redirigeix a `/login`.
2. Inicia sessió com a client (no entrenador) i accedeix a `/clients/progress`.
   - **Esperat**: redirigeix a `/client-home`.

### Internacionalització
1. A la pàgina de progrés, canvia l'idioma al castellà.
   - **Esperat**: totes les etiquetes (Última sesión, Sesiones totales, etc.) canvien sense recarregar la pàgina.

---

## Tests E2E en CI (LW-445)

### Quan s'obre un PR

Cada PR contra `main` dispara automàticament el workflow **"E2E Tests (Playwright)"**.
A la pàgina del PR, a la secció **Checks**, trobaràs el check `e2e / playwright`.

| Estat | Significat |
|-------|------------|
| ✅ `success` | Tots els tests E2E han passat. El PR pot fer-se merge. |
| ❌ `failure` | Algun test ha fallat. El merge queda bloquejat fins que es corregeixi. |
| 🟡 `in_progress` | El workflow encara s'està executant (~5–8 min). |

### Com accedir als artefactes en cas de fallada

1. Fes clic a **Details** al costat del check `e2e / playwright` en fallida.
2. A la pàgina del run, fes clic a la pestanya **Summary**.
3. A la secció **Artifacts**, descarrega `e2e-report-<run_id>`.
4. Descomprimeix l'arxiu i obre el report localment:
   ```bash
   npx playwright show-report ruta/a/playwright-report
   ```
5. El report mostra cada test fallat amb la seva **traça** (trace), **captura de pantalla** i **vídeo** del moment de la fallada.

### Notes importants

- Els artefactes s'eliminen automàticament als **7 dies** — descarrega'ls aviat si els necessites.
- Els tests amb comportament inestable (*flaky*) es reintenten automàticament fins a 2 vegades en CI.
  Si un test falla constantment, obre una issue i assigna-la a la pròxima sprint.
- **Mai activar `E2E_TESTING=true` en producció** — aquest flag habilita endpoints que esborren dades.

---

## Historial i Estadístiques del Client (LW-270)

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
- A `/client/history`, fes clic al botó "Tornar" → confirma que torna a `/client-home`


---

## Flux de Recuperació de Contrasenya (LW-454)

#### 1. Sol·licitar reset — email registrat
- Navega a `/forgot-password`
- Introdueix l'email d'un usuari registrat i fes clic a "Enviar"
- Confirma que el botó queda deshabilitat mentre la petició és en vol
- Confirma que apareix un missatge de confirmació genèric (no revela si el correu existeix)
- Comprova a la consola del backend la URL de previsualització d'Ethereal (entorn dev)
- Obre l'URL d'Ethereal → confirma que l'email conté l'enllaç `/reset-password?token=...`

#### 2. Sol·licitar reset — email no registrat
- Navega a `/forgot-password`
- Introdueix un email que no existeix a la BD
- Confirma que apareix un missatge d'error en línia sota el camp
- Confirma que la pàgina NO redirigeix a `/login`

#### 3. Restablir contrasenya — flux exitós
- Copia el token de l'URL de l'email obtinguda a l'Escenari 1
- Navega a `/reset-password?token=<token>`
- Confirma que la pàgina renderitza els dos camps de contrasenya (sense JWT no hi ha redirecció)
- Introdueix una nova contrasenya vàlida (mínim 8 caràcters) en els dos camps
- Fes clic a "Restablir contrasenya"
- Confirma que apareix un toast d'èxit i la SPA redirigeix a `/login`
- Inicia sessió amb la nova contrasenya → confirma accés exitós

#### 4. Validació al client — contrasenyes no coincidents
- Navega a `/reset-password?token=<qualsevol>`
- Introdueix contrasenyes different als dos camps i fes clic a "Restablir"
- Confirma que apareix l'error "les contrasenyes no coincideixen" sense fer cap crida a la API

#### 5. Validació al client — contrasenya massa curta
- Navega a `/reset-password?token=<qualsevol>`
- Introdueix "curta" als dos camps i fes clic a "Restablir"
- Confirma que apareix l'error de mínim 8 caràcters sense fer cap crida a la API

#### 6. Token expirat o ja usat
- Usa el token consumit a l'Escenari 3 o espera 30 minuts fins que expiri
- Navega a `/reset-password?token=<token_usat_o_expirat>`
- Intenta restablir la contrasenya → confirma missatge d'error
- Confirma que la pàgina mostra un enllaç a `/forgot-password` per sol·licitar un nou token

---

## Control de Sessió Única (LW-459)

### 1. Sessió concurrent bloquejada
- Inicia sessió amb un compte (COACH o CLIENT) en Chrome
- Obre Firefox i intenta iniciar sessió amb el mateix compte i contrasenya
- **Resultat esperat:** Firefox mostra el missatge "Ja tens una sessió activa en un altre dispositiu" (en Català) i no s'obre sessió

### 2. Login possible després de tancar sessió
- Amb Chrome connectat, fes clic al botó de tancar sessió
- Comprova a la pestanya Network (DevTools) que s'ha enviat `POST /api/auth/logout` i s'ha rebut HTTP 200
- Ara inicia sessió a Firefox amb el mateix compte
- **Resultat esperat:** El login a Firefox és exitós

### 3. Alliberament de sessió per desconnexió de socket
- Inicia sessió a Chrome (no tanquis sessió)
- Tanca la pestanya de Chrome completament (sense fer logout)
- Espera 30 segons
- Intenta iniciar sessió a Firefox amb el mateix compte
- **Resultat esperat:** El login a Firefox és exitós (la sessió s'ha alliberat per timeout de socket)

### 4. Reconnexió ràpida no bloqueja (refresc de pàgina)
- Inicia sessió a Chrome
- Refresca la pàgina (F5) ràpidament
- **Resultat esperat:** L'usuari segueix autenticat i no es necessita tornar a fer login
