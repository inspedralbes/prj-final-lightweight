# LightWeight 🏋️

> **Aplicació web per a entrenadors personals i els seus clients.**  
> Gestiona rutines, assigna entrenaments, xateja i fes videollamades — tot des d'un sol lloc.

---

## Índex

| Secció                                                                | Contingut                                 |
| --------------------------------------------------------------------- | ----------------------------------------- |
| [Sobre el projecte](#sobre-el-projecte)                               | Descripció, estat i equip                 |
| [Tecnologies](#tecnologies)                                           | Stack complet                             |
| [Arquitectura](#arquitectura)                                         | Serveis Docker i flux de dades            |
| [Model de dades](#model-de-dades)                                     | Entitats principals                       |
| [Estructura de carpetes](#estructura-de-carpetes)                     | Organització del codi front-end           |
| [Funcionalitats detallades](#funcionalitats-detallades)               | Descripció funcional completa             |
| [Quick Start (dev)](#quick-start-dev)                                 | Posar el projecte en marxa pas a pas      |
| [Variables d'entorn](#variables-dentorn)                              | Què cal configurar al `.env`              |
| [Comandaments útils](#comandaments-útils)                             | Referència ràpida de comandes             |
| [URLs i ports](#urls-i-ports)                                         | On s'accedeix a cada servei               |
| [Desplegament a producció](#desplegament-a-producció)                 | Docker Compose prod                       |
| [HTTPS i certificats SSL](#https-i-certificats-ssl)                   | Let's Encrypt amb Certbot dins de Docker  |
| [Primera posada en marxa a la VPS](#primera-posada-en-marxa-a-la-vps) | Passos manuals un cop desplegat per CI/CD |
| [CI/CD — GitHub Actions](#cicd--github-actions)                       | Workflow de desplegament automàtic        |
| [Rol de cada usuari](#rol-de-cada-usuari)                             | Coach vs Client                           |

---

## Sobre el projecte

**LightWeight** és una plataforma de fitness que connecta entrenadors personals (coaches) amb els seus clients.

### Funcionalitats principals

- Crear i assignar rutines d'entrenament amb catàleg d'exercicis.
- Fer sessions en solitari o amb un amic en temps real (WebSockets).
- **Xat P2P** en temps real entre coach i client.
- **Videollamada WebRTC** directa entre coach i client des del xat.
- Sistema d'invitacions per vincular un coach amb un client.
- Notificacions en temps real (missatges, invitacions).
- Internacionalització completa: Català, Castellà i Anglès.
- Mode fosc / mode clar.

### Equip

| Nom     | Rol                        |
| ------- | -------------------------- |
| Valeria | Desenvolupament full-stack |
| Amin    | Desenvolupament full-stack |
| David   | Desenvolupament full-stack |
| Bryan   | Desenvolupament full-stack |

### Estat del projecte

🟢 **MVP funcional en producció** — Rutines, sessions, xat P2P, videollamades i notificacions en temps real estan implementades i desplegades.

### Enllaços

| Recurs            | URL                                      |
| ----------------- | ---------------------------------------- |
| URL de producció  | https://lightweight.daw.inspedralbes.cat |
| Gestor de tasques | _(Jira — afegir URL)_                    |
| Prototip gràfic   | _(Figma — afegir URL)_                   |

---

## Tecnologies

### Front-end

| Tecnologia       | Versió | Per a què serveix                           |
| ---------------- | ------ | ------------------------------------------- |
| React            | 19     | Biblioteca d'interfície d'usuari            |
| TypeScript       | 5.9    | Tipat estàtic del codi                      |
| Vite             | 7      | Bundler i servidor de desenvolupament       |
| Tailwind CSS     | 4      | Estils amb classes utilitàries              |
| React Router     | 7      | Navegació entre pàgines                     |
| i18next          | 24     | Internacionalització (CA / ES / EN)         |
| Socket.io-client | 4      | WebSockets per a temps real                 |
| Lucide React     | 0.475  | Icones                                      |
| Axios            | 1.13   | Peticions HTTP al backend                   |
| WebRTC           | —      | Videollamades P2P entre navegadors          |
| Web Audio API    | —      | Ringtone de trucada (sense fitxers externs) |

### Back-end

| Tecnologia     | Versió | Per a què serveix                               |
| -------------- | ------ | ----------------------------------------------- |
| NestJS         | 11     | Framework Node.js (REST + WebSockets)           |
| Prisma         | 6      | ORM per accedir a la base de dades              |
| PostgreSQL     | 17     | Base de dades relacional                        |
| JWT + Passport | —      | Autenticació i autorització                     |
| Socket.io      | 4      | Servidor WebSocket (xat + senyalització WebRTC) |

### Infraestructura

| Eina                    | Per a què serveix                            |
| ----------------------- | -------------------------------------------- |
| Docker + Docker Compose | Orquestrar tots els serveis                  |
| Nginx                   | Proxy invers, terminació SSL                 |
| Certbot (Docker)        | Obtenció/renovació certificats Let's Encrypt |
| Adminer                 | Interfície web per explorar la BD            |
| GitHub Actions          | CI/CD: rsync + `docker compose up` automàtic |

---

## Arquitectura

### Entorn de desenvolupament

```
Navegador
    │
    ▼
┌─────────────┐        ┌──────────────────┐
│  Front-end  │◄──────►│  Back-end NestJS │
│  React/Vite │  HTTP  │  Port 3000       │
│  Port 5173  │◄──────►│  WebSocket       │
└─────────────┘  WS    └────────┬─────────┘
                                 │ Prisma ORM
                        ┌────────▼─────────┐
                        │   PostgreSQL 17   │
                        │   Port 5432       │
                        └──────────────────┘
```

### Entorn de producció

```
Internet
    │
    ▼ :80 / :443
┌──────────────┐
│    Nginx     │  ← Proxy invers + terminació SSL (TLS 1.2/1.3)
└──────┬───────┘
       │
       ├──/api/*       ──►  backend:3000  (NestJS REST)
       ├──/socket.io/* ──►  backend:3000  (Socket.io WS)
       └──/*           ──►  frontend:5173 (React)

┌──────────────────────────┐
│  Volums Docker           │
│  letsencrypt  → certs SSL│
│  certbot-webroot → ACME  │
│  postgres_db  → dades BD │
└──────────────────────────┘
```

La BD i el backend **no** s'exposen directament a internet. Tot el trànsit passa per Nginx.

### Senyalització WebRTC

```
          caller (P2PChat)                callee (AppContent)
               │                                  │
               │── video-call-invite ─────────────►│
               │◄─ video-call-delivered ───────────│  (callee online)
               │   (o video-call-unavailable)      │
               │                                   │
               │◄─ video-call-accept ──────────────│
               │                                   │
               │──── join-room (roomId) ───────────►│
               │◄─── offer / answer / ice ──────────│  (WebRTC handshake)
               │                                   │
               │◄══════ Canal P2P UDP/TCP ══════════│  (media directa)
```

- El servidor **mai** rep el flux de vídeo/àudio, només fa de relay de senyalització.
- La connexió WebRTC utilitza servidors STUN de Google (`stun.l.google.com:19302`).

---

## Model de dades

```
User ──────────────────────── (COACH o CLIENT)
 │
 ├── coachId? ──────────────► User (el coach del client)
 ├── ClientProfile ─────────── notes privades del coach, objectius
 ├── Routine[] ─────────────── rutines creades pel coach
 │    └── RoutineExercise[] ── exercicis (sets / reps / rest / order)
 │         └── ExerciseCatalog ─ catàleg global d'exercicis
 ├── RoutineAssignment[] ────── quines rutines té assignades un client
 ├── Invitation[] ───────────── invitacions coach→client (codi o directe)
 ├── LiveSession[] ──────────── sessions en directe (sessionCode)
 └── P2PChatMessage[] ───────── xat P2P (text, read, timestamps)
```

**Enums importants:**

| Enum               | Valors                                      |
| ------------------ | ------------------------------------------- |
| `UserRole`         | `COACH`, `CLIENT`                           |
| `InvitationStatus` | `PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED` |
| `SessionStatus`    | `PENDING`, `ACTIVE`, `COMPLETED`            |

**Cascades configurades:** `RoutineExercise` → `Routine`, `RoutineAssignment` → `Routine`/`User`, `ClientProfile` → `User`, missatges → `User`/`LiveSession`.

---

## Estructura de carpetes

L'arquitectura del front-end segueix el patró **Feature-based modular**.

```
src/front/src/
│
├── App.tsx                    # Router principal + guards de rol + listeners globals WS
├── main.tsx                   # Punt d'entrada, providers globals
│
├── i18n/
│   ├── config.ts
│   └── locales/
│       ├── ca.json            # Català (idioma per defecte)
│       ├── es.json            # Castellà
│       └── en.json            # Anglès
│
├── shared/
│   ├── components/
│   │   ├── ConfirmModal.tsx
│   │   ├── Icons.tsx          # SVG: VideoCamera, PhoneOff, Mic, MicOff + altres
│   │   ├── LoadingScreen.tsx
│   │   ├── ToastContainer.tsx
│   │   └── ToastProvider.tsx
│   ├── layout/
│   │   ├── Layout.tsx         # Sidebar + topbar mòbil (logo centrat absolut)
│   │   ├── AuthPageHeader.tsx
│   │   ├── LanguageSwitcher.tsx
│   │   └── ThemeSwitcher.tsx
│   ├── hooks/
│   │   ├── useToast.ts
│   │   └── useRingtone.ts     # Web Audio API: ringtone iOS-compatible
│   ├── services/
│   │   └── invitationsService.ts
│   └── utils/
│       └── api.ts             # Client HTTP (axios + interceptor JWT + 401 redirect)
│
└── features/
    ├── auth/
    │   ├── pages/
    │   │   ├── Login.tsx          # Background image en mobile + formulari
    │   │   ├── Register.tsx
    │   │   └── ForgotPassword.tsx
    │   ├── components/
    │   │   └── ProtectedRoute.tsx
    │   └── context/
    │       └── AuthContext.tsx
    │
    ├── chat/
    │   ├── components/
    │   │   ├── P2PChat.tsx            # Xat + lògica CALLER (videollamada)
    │   │   └── VideoCallModal.tsx     # Modal WebRTC: PiP local + remot fullscreen
    │   └── services/
    │       └── chatService.ts
    │
    ├── routines/
    │   ├── pages/
    │   │   └── RoutineExercisesEdit.tsx
    │   ├── components/
    │   │   ├── RoutineCard.tsx
    │   │   └── RoutineModal.tsx
    │   └── services/
    │       └── routineService.ts
    │
    ├── exercises/
    │   └── components/
    │       ├── ExercisesForm.tsx
    │       └── ExerciseSearchModal.tsx
    │
    ├── workout/
    │   ├── pages/
    │   │   ├── SoloWorkoutSession.tsx
    │   │   ├── CoopSessionLobby.tsx
    │   │   └── WorkoutRoom.tsx
    │   ├── components/
    │   │   ├── ActiveSession.tsx
    │   │   ├── RoomLobby.tsx
    │   │   └── SessionSummary.tsx
    │   └── services/
    │       └── socket.ts          # Singleton Socket.io (compartit per tota l'app)
    │
    ├── notifications/
    │   ├── components/
    │   │   └── NotificationCenter.tsx
    │   └── context/
    │       └── NotificationContext.tsx
    │
    └── (coach/ i client/ — pàgines de gestió específiques per rol)
```

### Regla de dependències

```
shared  ←  features/*  ←  App.tsx
```

- `shared/` **mai** importa de `features/`.
- Una feature **no** importa d'una altra feature directament.
- Tots els imports utilitzen l'àlies `@/` (apunta a `src/`).

### Arquitectura de la videollamada

| Component              | Rol                                                                 | Muntat quan               |
| ---------------------- | ------------------------------------------------------------------- | ------------------------- |
| `P2PChat`              | **Caller** — inicia trucada, estats: `idle→pending→calling→in-call` | Finestra de xat oberta    |
| `AppContent` (App.tsx) | **Callee** — rep `video-call-invite`, mostra popup + ringtone       | Sempre (usuari loguejat)  |
| `VideoCallModal`       | WebRTC: offer/answer/ICE, vídeo local PiP, remot fullscreen, mute   | Quan la trucada és activa |

---

## Funcionalitats detallades

### Videollamada WebRTC

- Botó taronja amb icona de càmera a la capçalera del xat.
- **Estat `pending`**: evita el flash si el destinatari no és online.
- **`video-call-delivered`**: server confirma que el destinatari és online → popup "trucant".
- **`video-call-unavailable`**: destinatari offline → toast, sense popup.
- Ringtone sortint (caller) i entrant (callee) via Web Audio API — sense fitxers de so externs.
- El popup d'entrada apareix a qualsevol pàgina (muntat a `AppContent`).
- Timeout automàtic de 30 s si no es respon.
- Cancel·lació del caller descarta el popup del callee.
- Vídeo local en PiP (baix a la dreta), vídeo remot a pantalla completa.
- Botó mute (toggle micròfon) i botó vermell de penjar.
- Error clar si la càmera/micròfon és denegada.

> ⚠️ **Requisit:** `getUserMedia` requereix **HTTPS** a producció (excepte `localhost`).

### Ringtone iOS compatible

El hook `useRingtone` pre-desbloqueja l'`AudioContext` en el primer `touchstart`/`click`. iOS Safari suspèn qualsevol context d'àudio no creat durant un gest de l'usuari. L'`AudioContext` mai es tanca per preservar l'estat desbloquejat.

### Xat P2P

- Missatges en temps real via Socket.io.
- Badge (punt taronja) quan hi ha missatges no llegits.
- Notificació push via `NotificationContext` si el xat no és obert.
- Marca de llegits automàtica en obrir la conversa.

### Sessions d'entrenament

- **En solitari**: client fa els exercicis un a un amb comptador de sèries i resum final.
- **Amb amic**: coach crea sala amb codi de sessió; client s'uneix. Estat en temps real.

### Sistema d'invitacions

- Codi d'invitació o invitació directa per username.
- Badge al sidebar amb nombre d'invitacions pendents.
- Notificació en temps real en acceptar/rebutjar.

---

## Quick Start (dev)

> **Prerequisits:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) i [Node.js 20+](https://nodejs.org/).

### Pas 1 — Clona el repositori

```bash
git clone <URL-del-repositori>
cd prj-final-lightweight
```

### Pas 2 — Crea el fitxer d'entorn

```bash
cp .env.example .env
# Edita .env amb les teves variables
```

### Pas 3 — Arrenca tots els serveis

```bash
docker compose up
```

Aixeca: PostgreSQL · Backend NestJS · Frontend React · Adminer.

### Pas 4 — Inicialitza la base de dades

```bash
docker exec -it lw-backend sh
npx prisma generate
npx prisma migrate dev --name init
exit
```

### Pas 5 — Accedeix a l'aplicació

| Servei        | URL                   |
| ------------- | --------------------- |
| Frontend      | http://localhost:5173 |
| Backend (API) | http://localhost:3000 |
| Adminer (BD)  | http://localhost:8081 |

---

## Variables d'entorn

```env
# ─── Base de dades ────────────────────────────────────────
POSTGRES_USER=lightweight_user
POSTGRES_PASSWORD=la_teva_contrasenya_segura
POSTGRES_DB=lightweight_db
DATABASE_URL=postgresql://lightweight_user:la_teva_contrasenya_segura@lw-postgres:5432/lightweight_db?schema=public

# ─── Autenticació JWT ─────────────────────────────────────
JWT_SECRET=posa_aqui_una_clau_molt_llarga_i_secreta_123

# ─── URLs ─────────────────────────────────────────────────
# Desenvolupament local
FRONTEND_URL=http://localhost:5173
VITE_BACK_URL=http://localhost:3000

# Producció (HTTPS obligatori per videollamades)
# FRONTEND_URL=https://lightweight.daw.inspedralbes.cat
# VITE_BACK_URL=https://lightweight.daw.inspedralbes.cat/api
```

---

## Comandaments útils

### Docker

```bash
docker compose up -d                  # Aixecar en background
docker compose logs -f backend        # Logs del backend en temps real
docker compose down                   # Aturar i eliminar contenidors
docker compose up --build             # Reconstruir imatges
```

### Prisma (dins del contenidor `lw-backend`)

```bash
docker exec -it lw-backend sh
npx prisma generate                   # Regenerar client (obligatori en canviar schema)
npx prisma migrate dev --name nom     # Nova migració
npx prisma validate                   # Validar schema
npx prisma studio                     # Interfície visual de la BD
```

### Front-end (local, sense Docker)

```bash
cd src/front
npm install
npm run dev                           # Servidor de dev
npm run build                         # Build de producció
npm run lint                          # Linting
./node_modules/.bin/tsc --noEmit      # Type check
```

### Back-end (local, sense Docker)

```bash
cd src/back
npm install
npm run start:dev                     # Dev amb hot reload
npm run build                         # Build de producció
```

---

## URLs i ports

| Servei         | Port (dev) | Port (prod)          |
| -------------- | ---------- | -------------------- |
| Frontend React | `5173`     | Nginx `:80` → `:443` |
| Backend NestJS | `3000`     | Intern (Nginx proxy) |
| PostgreSQL     | `5432`     | No exposat           |
| Adminer        | `8081`     | Intern (Nginx proxy) |

---

## Desplegament a producció

El fitxer `docker-compose.prod.yml` orquestra tots els serveis:

| Servei        | Descripció                                                       |
| ------------- | ---------------------------------------------------------------- |
| `backend`     | NestJS compilat (`Dockerfile.prod`)                              |
| `frontend`    | React compilat (`Dockerfile.prod`)                               |
| `lw-postgres` | PostgreSQL 17, volum persistent                                  |
| `adminer`     | Accés via `/adminer/`                                            |
| `nginx`       | Proxy invers + SSL, ports 80 i 443                               |
| `certbot`     | Contenidor `certbot/certbot`, perfil `certbot` (no corre sempre) |

### Volums de producció

| Volum             | Contingut                                   |
| ----------------- | ------------------------------------------- |
| `postgres_db`     | Dades de PostgreSQL                         |
| `letsencrypt`     | Certificats SSL (persisten entre redeploys) |
| `certbot-webroot` | Fitxers del challenge ACME                  |

---

## HTTPS i certificats SSL

### Per què és necessari

Els navegadors bloquegen `getUserMedia()` (videollamades) en HTTP. La producció **requereix HTTPS**.

### Arquitectura (totalment dockeritzada)

No cal instal·lar res al servidor host. Certbot corre com a contenidor Docker i escriu els certificats en un volum compartit amb Nginx.

```
Certbot container
    │  certonly --webroot
    │  escriu certs a → volum letsencrypt
    ▼
Nginx container
    │  llegeix certs des de → volum letsencrypt
    │  serveix HTTPS port 443
```

### Renovació automàtica

```bash
sudo crontab -e
```

```cron
0 3 * * 1  cd /opt/lw-app && docker compose -f docker-compose.prod.yml --profile certbot run --rm certbot renew && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

S'executa cada dilluns a les 3h. Certbot només renova si queden < 30 dies.

### Fitxers relacionats

| Fitxer                    | Funció                                            |
| ------------------------- | ------------------------------------------------- |
| `nginx/default.conf`      | Config Nginx amb HTTPS (ús normal)                |
| `nginx/default-init.conf` | Config Nginx HTTP-only (primera arrancada)        |
| `init-ssl.sh`             | Script d'inicialització SSL (executar una vegada) |
| `docker-compose.prod.yml` | Servei `certbot` amb perfil `certbot`             |

---

## Primera posada en marxa a la VPS

> Passos a executar **una sola vegada** al servidor, després del primer deploy via GitHub Actions.

### Context

El workflow de CI/CD fa:

1. `rsync` — sincronitza el codi a `/opt/lw-app/`
2. Escriu el `.env` des del secret `ENV_FILE`
3. `docker compose -f docker-compose.prod.yml up -d --build`

En el **primer** desplegament, Nginx falla perquè els certificats no existeixen. És esperat.

### Procediment

**1. Connecta't per SSH:**

```bash
ssh usuari@lightweight.daw.inspedralbes.cat
cd /opt/lw-app
```

**2. Executa el script d'init SSL:**

```bash
bash init-ssl.sh
```

El script fa automàticament:

1. Copia `nginx/default-init.conf` com a config activa → Nginx arrenca en HTTP
2. `docker compose up -d --build` — aixeca tots els serveis
3. `docker compose --profile certbot run --rm certbot` — obté el cert Let's Encrypt
4. Restaura `nginx/default.conf` i recarga Nginx en calent (`nginx -s reload`)

**3. Verifica:**

```bash
curl -I https://lightweight.daw.inspedralbes.cat
# Ha de retornar: HTTP/2 200
```

**4. Configura la renovació automàtica (una sola vegada):**

Veure la secció [HTTPS i certificats SSL](#https-i-certificats-ssl).

### Sobre els redeploys posteriors

A partir d'aquí, cada push a `main` → GitHub Actions fa el redeploy automàticament. Els certificats **persisteixen en el volum Docker** `letsencrypt` — no s'esborren entre deploys.

---

## CI/CD — GitHub Actions

El fitxer `.github/workflows/deploy.yml` automatitza el desplegament a cada `push` a `main`.

### Flux

```
git push → main
      │
      ▼
┌─────────────────────────────┐
│   GitHub Actions runner     │
│   (ubuntu-latest)           │
│                             │
│  1. Checkout del codi       │
│  2. rsync → /opt/lw-app/    │
│  3. Escriu .env              │
│  4. docker compose up prod  │
└─────────────────────────────┘
```

### Secrets necessaris a GitHub

Configura a **Settings → Secrets and variables → Actions**:

| Secret     | Descripció                             | Exemple                                  |
| ---------- | -------------------------------------- | ---------------------------------------- |
| `SSH_HOST` | IP o domini del servidor               | `lightweight.daw.inspedralbes.cat`       |
| `SSH_USER` | Usuari SSH                             | `ubuntu` / `deploy`                      |
| `SSH_KEY`  | Clau privada SSH (format PEM, sencera) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `ENV_FILE` | Contingut complet del `.env` de prod   | veure exemple a sota                     |

#### Exemple de `ENV_FILE` per a producció

```env
POSTGRES_USER=lightweight_user
POSTGRES_PASSWORD=contrasenya_molt_segura
POSTGRES_DB=lightweight_db
DATABASE_URL=postgresql://lightweight_user:contrasenya_molt_segura@lw-postgres:5432/lightweight_db?schema=public
JWT_SECRET=clau_jwt_molt_llarga_i_secreta
FRONTEND_URL=https://lightweight.daw.inspedralbes.cat
VITE_BACK_URL=https://lightweight.daw.inspedralbes.cat/api
NODE_ENV=production
```

> ⚠️ Les URLs han de ser **HTTPS** per tal que la videollamada funcioni.

### Requisits del servidor

- Docker i Docker Compose instal·lats.
- Usuari SSH amb permisos per executar Docker i escriure a `/opt/lw-app/`.
- Port `22` obert per SSH des de GitHub Actions.
- Ports `80` i `443` oberts per al trànsit web.
- Domini DNS apuntant a la IP del servidor.

### Activació manual

1. Ves a **Actions** al repositori GitHub.
2. Selecciona **"Deploy (rsync + docker compose)"**.
3. Clica **Run workflow**.

---

## Rol de cada usuari

### COACH (Entrenador)

| Funcionalitat    | Descripció                                                  |
| ---------------- | ----------------------------------------------------------- |
| Dashboard        | Crea, edita, elimina i publica rutines (públiques/privades) |
| Clients          | Llista de clients, notes privades, desvinculació            |
| Invitacions      | Genera codis o envia invitacions directes per username      |
| Assignació       | Assigna rutines als seus clients                            |
| Xat P2P          | Missatgeria en temps real amb cada client                   |
| **Videollamada** | Inicia/rep trucades de vídeo WebRTC directament des del xat |

### CLIENT

| Funcionalitat     | Descripció                                                       |
| ----------------- | ---------------------------------------------------------------- |
| Les meves rutines | Veu les rutines assignades, pot iniciar sessió d'entrenament     |
| El meu coach      | Accepta/rebutja invitacions, pot desvincular-se del coach        |
| Entrenar amb amic | Crea o s'uneix a una sala d'entrenament cooperatiu en temps real |
| Sessió individual | Fa una rutina en solitari amb comptador de sèries i resum final  |
| Xat P2P           | Missatgeria en temps real amb el coach                           |
| **Videollamada**  | Inicia/rep trucades de vídeo WebRTC directament des del xat      |
