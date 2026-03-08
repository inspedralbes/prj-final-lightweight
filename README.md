# LightWeight 🏋️

> **Aplicació web per a entrenadors personals i els seus clients.**  
> Gestiona rutines, assigna entrenaments, xateja i fes videollamades — tot des d'un sol lloc.

---

## Índex (JIT Indexing)

| Secció                                                | Contingut                            |
| ----------------------------------------------------- | ------------------------------------ |
| [Sobre el projecte](#sobre-el-projecte)               | Descripció, estat i equip            |
| [Tecnologies](#tecnologies)                           | Stack complet                        |
| [Arquitectura](#arquitectura)                         | Serveis Docker i flux de dades       |
| [Model de dades](#model-de-dades)                     | Entitats principals                  |
| [Estructura de carpetes](#estructura-de-carpetes)     | Organització del codi front-end      |
| [Quick Start (dev)](#quick-start-dev)                 | Posar el projecte en marxa pas a pas |
| [Variables d'entorn](#variables-dentorn)              | Què cal configurar al `.env`         |
| [Comandaments útils](#comandaments-útils)             | Referència ràpida de comandes        |
| [URLs i ports](#urls-i-ports)                         | On s'accedeix a cada servei          |
| [Desplegament a producció](#desplegament-a-producció) | Docker Compose prod                  |
| [CI/CD — GitHub Actions](#cicd--github-actions)       | Workflow de desplegament automàtic   |
| [Rol de cada usuari](#rol-de-cada-usuari)             | Coach vs Client                      |

---

## Sobre el projecte

**LightWeight** és una plataforma de fitness que connecta entrenadors personals (coaches) amb els seus clients. Permet:

- Crear i assignar rutines d'entrenament.
- Fer sessions en solitari o amb un amic en temps real (WebSockets).
- Xat P2P entre coach i client.
- Sistema d'invitacions per vincular un coach amb un client.
- Notificacions en temps real.

### Equip

| Nom     | Rol                        |
| ------- | -------------------------- |
| Valeria | Desenvolupament full-stack |
| Amin    | Desenvolupament full-stack |
| David   | Desenvolupament full-stack |
| Bryan   | Desenvolupament full-stack |

### Estat del projecte

🟠 **En desenvolupament actiu** — MVP funcional. Les funcionalitats de sessió en temps real, xat P2P i gestió de rutines estan implementades. Pendents: dietes, estadístiques avançades.

### Enllaços

| Recurs            | URL                               |
| ----------------- | --------------------------------- |
| Gestor de tasques | _(Jira — afegir URL)_             |
| Prototip gràfic   | _(Figma — afegir URL)_            |
| URL de producció  | _(afegir quan estigui desplegat)_ |

---

## Tecnologies

### Front-end

| Tecnologia       | Versió | Per a què serveix                     |
| ---------------- | ------ | ------------------------------------- |
| React            | 19     | Biblioteca d'interfície d'usuari      |
| TypeScript       | 5.9    | Tipat estàtic del codi                |
| Vite             | 7      | Bundler i servidor de desenvolupament |
| Tailwind CSS     | 4      | Estils amb classes utilitàries        |
| React Router     | 7      | Navegació entre pàgines               |
| i18next          | 24     | Internacionalització (CA / ES / EN)   |
| Socket.io-client | 4      | WebSockets per a temps real           |
| Lucide React     | 0.475  | Icones                                |
| Axios            | 1.13   | Peticions HTTP al backend             |

### Back-end

| Tecnologia     | Versió | Per a què serveix                     |
| -------------- | ------ | ------------------------------------- |
| NestJS         | 11     | Framework Node.js (REST + WebSockets) |
| Prisma         | 6      | ORM per accedir a la base de dades    |
| PostgreSQL     | 17     | Base de dades relacional              |
| JWT + Passport | —      | Autenticació i autorització           |
| Socket.io      | 4      | Servidor WebSocket                    |

### Infraestructura

| Eina                    | Per a què serveix                 |
| ----------------------- | --------------------------------- |
| Docker + Docker Compose | Orquestrar tots els serveis       |
| Nginx                   | Proxy invers en producció         |
| Adminer                 | Interfície web per explorar la BD |

---

## Arquitectura

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
                        │   Port 5432      │
                        └──────────────────┘
                        ┌──────────────────┐
                        │    Adminer       │
                        │   Port 8081      │
                        └──────────────────┘
```

En **producció**, Nginx fa de proxy invers i és l'únic port exposat a internet (80/443). La BD i el backend **no** s'exposen directament.

---

## Model de dades

Les entitats principals del sistema:

```
User ──────────────────────── (COACH o CLIENT)
 │
 ├── coachId? ──────────────► User (el coach del client)
 ├── ClientProfile ─────────── notes privades del coach, objectius
 ├── Routine[] ─────────────── rutines creades pel coach
 │    └── RoutineExercise[] ── exercicis de la rutina (sets/reps/rest)
 │         └── ExerciseCatalog ─ catàleg global d'exercicis
 ├── RoutineAssignment[] ────── quines rutines té assignades un client
 ├── Invitation[] ───────────── invitacions coach→client
 ├── LiveSession[] ──────────── sessions en directe
 └── P2PChatMessage[] ───────── xat P2P
```

**Enums importants:**

| Enum               | Valors                                      |
| ------------------ | ------------------------------------------- |
| `UserRole`         | `COACH`, `CLIENT`                           |
| `InvitationStatus` | `PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED` |
| `SessionStatus`    | `PENDING`, `ACTIVE`, `COMPLETED`            |

---

## Estructura de carpetes

L'arquitectura del front-end segueix el patró **Feature-based modular** (inspirat en Feature-Sliced Design), on cada funcionalitat de negoci és autònoma.

```
src/front/src/
│
├── App.tsx                    # Router principal + guards de rol
├── main.tsx                   # Punt d'entrada, providers globals
│
├── assets/                    # Imatges i recursos estàtics
│
├── i18n/                      # Internacionalització (transversal)
│   ├── config.ts
│   └── locales/
│       ├── ca.json            # Català
│       ├── es.json            # Castellà
│       └── en.json            # Anglès
│
├── shared/                    # Codi TRANSVERSAL — sense lògica de domini
│   ├── components/            # Primitius UI reutilitzables (no saben de negoci)
│   │   ├── ConfirmModal.tsx
│   │   ├── Icons.tsx
│   │   ├── LoadingScreen.tsx
│   │   ├── ToastContainer.tsx
│   │   └── ToastProvider.tsx
│   ├── layout/                # Estructura visual de l'app
│   │   ├── Layout.tsx         # Sidebar + contenidor principal
│   │   ├── AuthPageHeader.tsx
│   │   ├── LanguageSwitcher.tsx
│   │   └── ThemeSwitcher.tsx
│   ├── context/               # Contexts globals sense domini
│   │   ├── ThemeContext.tsx
│   │   └── ToastContext.tsx
│   ├── hooks/
│   │   └── useToast.ts
│   ├── services/
│   │   └── invitationsService.ts  # Usat per coach i client
│   └── utils/
│       └── api.ts             # Client HTTP base (axios wrapper)
│
└── features/                  # Bounded contexts del negoci
    │
    ├── auth/                  # Autenticació i autorització
    │   ├── pages/
    │   │   ├── Login.tsx
    │   │   ├── Register.tsx
    │   │   └── ForgotPassword.tsx
    │   ├── components/
    │   │   └── ProtectedRoute.tsx   # Guard de ruta per rol
    │   └── context/
    │       └── AuthContext.tsx      # Usuari autenticat global
    │
    ├── coach/                 # Tot el que fa el COACH
    │   ├── pages/
    │   │   ├── CoachDashboard.tsx   # Gestió de rutines
    │   │   ├── CoachClientList.tsx  # Llista i gestió de clients
    │   │   └── CoachInvitePage.tsx  # Generar codis d'invitació
    │   └── services/
    │       └── coachClientService.ts # getClients, updateClient, unlinkClient, inviteByUser
    │
    ├── client/                # Tot el que fa el CLIENT
    │   ├── pages/
    │   │   ├── ClientDashboard.tsx  # Veure rutines assignades
    │   │   ├── ClientMyCoach.tsx    # Veure/gestionar el seu coach
    │   │   └── ClientJoinWithCode.tsx # Unir-se amb codi d'invitació
    │   └── services/
    │       └── myCoachService.ts    # getMe, unlinkFromCoach
    │
    ├── routines/              # Gestió de rutines i exercicis
    │   ├── pages/
    │   │   └── RoutineExercisesEdit.tsx # Editar exercicis d'una rutina
    │   ├── components/
    │   │   ├── RoutineCard.tsx      # Targeta de rutina (mode coach i client)
    │   │   └── RoutineModal.tsx     # Modal crear/editar rutina
    │   └── services/
    │       └── routineService.ts
    │
    ├── exercises/             # Catàleg d'exercicis
    │   └── components/
    │       ├── ExercisesForm.tsx
    │       └── ExerciseSearchModal.tsx
    │
    ├── workout/               # Execució de sessions d'entrenament
    │   ├── pages/
    │   │   ├── SoloWorkoutSession.tsx  # Sessió individual
    │   │   ├── CoopSessionLobby.tsx    # Lobby per entrenar amb amic
    │   │   └── WorkoutRoom.tsx         # Sala en temps real (WebSocket)
    │   ├── components/
    │   │   ├── ActiveSession.tsx       # Comptador i progrés en viu
    │   │   ├── RoomLobby.tsx           # Espera dins la sala
    │   │   └── SessionSummary.tsx      # Resum post-sessió
    │   └── services/
    │       └── socket.ts              # Connexió Socket.io
    │
    ├── chat/                  # Xat P2P coach ↔ client
    │   ├── components/
    │   │   └── P2PChat.tsx
    │   └── services/
    │       └── chatService.ts
    │
    └── notifications/         # Notificacions en temps real
        ├── components/
        │   └── NotificationCenter.tsx
        └── context/
            └── NotificationContext.tsx
```

### Regla de dependències

```
shared  ←  features/*  ←  App.tsx
```

- `shared/` **mai** importa de `features/`.
- Una feature **no** importa d'una altra feature directament.
- Tots els imports utilitzen l'àlies `@/` (apunta a `src/`).

---

## Quick Start (dev)

> ⚠️ **Prerequisits:** Necessites tenir instal·lat [Docker Desktop](https://www.docker.com/products/docker-desktop/) i [Node.js 20+](https://nodejs.org/). Si ets nou amb Docker, no preocupis: Docker Desktop inclou una interfície gràfica i tot el que necessites.

### Pas 1 — Clona el repositori

```bash
git clone <URL-del-repositori>
cd prj-final-lightweight
```

> 💡 `git clone` descarrega una còpia del projecte al teu ordinador. `cd` entra a la carpeta.

### Pas 2 — Crea el fitxer d'entorn

Copia el fitxer d'exemple i omple els valors:

```bash
cp .env.example .env
```

Obre `.env` amb qualsevol editor de text i revisa les variables (veure secció [Variables d'entorn](#variables-dentorn)).

> 💡 El fitxer `.env` conté les "claus secretes" del projecte (contrasenyes de BD, claus JWT...). **Mai el pugis a Git.**

### Pas 3 — Arrenca tots els serveis amb Docker

```bash
docker compose up
```

Aquest sol comandament aixeca:

- La base de dades PostgreSQL
- El backend NestJS
- El frontend React
- L'Adminer (gestor visual de BD)

> 💡 La primera vegada tarda uns minuts perquè ha de descarregar les imatges Docker. Les vegades següents serà molt més ràpid.

### Pas 4 — Genera el client Prisma i les taules

Obre una **nova terminal** i executa:

```bash
# Entra dins del contenidor del backend
docker exec -it lw-backend sh

# Ja ets dins del contenidor. Executa:
npx prisma generate
npx prisma migrate dev --name init
```

> 💡 `prisma generate` crea el codi que permet al backend parlar amb la base de dades. `migrate dev` crea les taules a PostgreSQL.

### Pas 5 — Verifica que tot funciona

Obre el navegador i accedeix a:

| Servei        | URL                   | Què és                 |
| ------------- | --------------------- | ---------------------- |
| Frontend      | http://localhost:5173 | L'aplicació web        |
| Backend (API) | http://localhost:3000 | L'API REST             |
| Adminer (BD)  | http://localhost:8081 | Gestor visual de la BD |

> 💡 Si veus l'aplicació al navegador, **tot funciona correctament**.

### Pas 6 — Desenvolupa!

El servidor de dev té **hot reload**: cada cop que guardes un fitxer, el navegador s'actualitza automàticament.

Per aturar tots els serveis:

```bash
# A la terminal on tens el docker compose up, prem:
Ctrl + C

# Per eliminar els contenidors completament:
docker compose down
```

---

## Variables d'entorn

Crea un fitxer `.env` a l'arrel del projecte amb aquestes variables:

```env
# ─── Base de dades ────────────────────────────────────────
POSTGRES_USER=lightweight_user
POSTGRES_PASSWORD=la_teva_contrasenya_segura
POSTGRES_DB=lightweight_db

# URL completa que usa el backend per connectar amb la BD
# (dins de Docker, el host és el nom del servei: lw-postgres)
DATABASE_URL=postgresql://lightweight_user:la_teva_contrasenya_segura@lw-postgres:5432/lightweight_db?schema=public

# ─── Autenticació JWT ─────────────────────────────────────
# Clau secreta per signar els tokens. Posa una cadena llarga i aleatòria.
JWT_SECRET=posa_aqui_una_clau_molt_llarga_i_secreta_123

# ─── URLs ─────────────────────────────────────────────────
# URL del frontend (per CORS al backend)
FRONTEND_URL=http://localhost:5173

# URL del backend (usada pel frontend per fer peticions HTTP)
VITE_BACK_URL=http://localhost:3000
```

---

## Comandaments útils

### Docker

```bash
# Aixecar tots els serveis en background
docker compose up -d

# Veure els logs del backend en temps real
docker compose logs -f backend

# Aturar tots els serveis
docker compose down

# Reconstruir les imatges (quan canvies el Dockerfile o package.json)
docker compose up --build
```

### Prisma (executar dins del contenidor: `docker exec -it lw-backend sh`)

```bash
# Generar el client Prisma (obligatori després de canviar schema.prisma)
npx prisma generate

# Crear una nova migració
npx prisma migrate dev --name nom_descriptiu

# Validar que l'schema és correcte
npx prisma validate

# Obrir Prisma Studio (interfície visual de la BD)
npx prisma studio
```

### Front-end (sense Docker, directament)

```bash
cd src/front

# Instal·lar dependències
npm install

# Servidor de desenvolupament
npm run dev

# Build de producció
npm run build

# Linting
npm run lint
```

### Back-end (sense Docker, directament)

```bash
cd src/back

# Instal·lar dependències
npm install

# Servidor de desenvolupament (amb hot reload)
npm run start:dev

# Build de producció
npm run build
```

---

## URLs i ports

| Servei         | Port (dev) | Port (prod)           |
| -------------- | ---------- | --------------------- |
| Frontend React | `5173`     | Nginx `80/443`        |
| Backend NestJS | `3000`     | Intern (Nginx proxy)  |
| PostgreSQL     | `5432`     | No exposat a internet |
| Adminer        | `8081`     | Intern opcional       |

---

## Desplegament a producció

El projecte inclou un `docker-compose.prod.yml` separat que:

- Construeix el frontend amb `Dockerfile.prod` (build estàtic servit per Nginx).
- No exposa la BD ni el backend directament a internet.
- Usa Nginx com a proxy invers.

```bash
# Desplegar manualment en producció (si tens accés SSH al servidor)
docker compose -f docker-compose.prod.yml up -d --build
```

El desplegament **habitual** és automàtic via GitHub Actions (vegeu la secció següent).

---

## CI/CD — GitHub Actions

El fitxer `.github/workflows/deploy.yml` automatitza el desplegament cada cop que es fa un `push` a la branca `main`.

### Com funciona (pas a pas)

```
git push → main
      │
      ▼
┌─────────────────────────────┐
│   GitHub Actions runner     │
│   (ubuntu-latest)           │
│                             │
│  1. Checkout del codi       │
│  2. rsync → servidor SSH    │
│  3. Escriu .env al servidor │
│  4. docker compose up prod  │
└─────────────────────────────┘
```

### Passos del workflow

| #   | Pas            | Eina                                | Descripció                                                                                  |
| --- | -------------- | ----------------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | **Checkout**   | `actions/checkout@v4`               | Descarrega el codi del repositori al runner                                                 |
| 2   | **Sync files** | `burnett01/rsync-deployments@7.0.1` | Copia tots els fitxers al servidor via rsync/SSH, excloent `.git` i `.github`               |
| 3   | **Write .env** | `appleboy/ssh-action@v1.0.3`        | Crea el fitxer `.env` al servidor a partir del secret `ENV_FILE`                            |
| 4   | **Compose up** | `appleboy/ssh-action@v1.0.3`        | Executa `docker compose -f docker-compose.prod.yml up -d --build` i neteja imatges antigues |

### Secrets necessaris a GitHub

Has de configurar aquests secrets a **Settings → Secrets and variables → Actions** del repositori:

| Secret     | Descripció                                       | Exemple                                  |
| ---------- | ------------------------------------------------ | ---------------------------------------- |
| `SSH_HOST` | IP o domini del servidor de producció            | `123.45.67.89` o `app.exemple.com`       |
| `SSH_USER` | Usuari SSH del servidor                          | `ubuntu` / `deploy`                      |
| `SSH_KEY`  | Clau privada SSH (en format PEM, sencera)        | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `ENV_FILE` | Contingut complet del fitxer `.env` de producció | `POSTGRES_USER=...\nJWT_SECRET=...`      |

> ⚠️ **Important:** El secret `ENV_FILE` ha de contenir **totes** les variables d'entorn del fitxer `.env` en una sola cadena, amb salts de línia (`\n`) entre cada variable. Mai afegeixis el fitxer `.env` directament al repositori.

### Com afegir un secret a GitHub

1. Ves al teu repositori a GitHub.
2. Clica **Settings** (configuració, a la part superior dreta).
3. Al menú esquerre, clica **Secrets and variables → Actions**.
4. Clica **New repository secret**.
5. Omple el nom (ex: `SSH_HOST`) i el valor.
6. Clica **Add secret**.

> 💡 Els secrets NO es mostren mai en clar als logs de GitHub Actions. Si algú accedeix als logs, no podrà veure les teves contrasenyes.

### Activació manual del workflow

A més del trigger automàtic per `push`, pots activar el desplegament manualment:

1. Ves a la pestanya **Actions** del teu repositori.
2. Selecciona el workflow **"Deploy (rsync + docker compose)"**.
3. Clica **Run workflow → Run workflow**.

### Fitxer del workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy (rsync + docker compose)

on:
  push:
    branches: ["main"] # S'activa automàticament en fer push a main
  workflow_dispatch: # Permet activació manual des de GitHub

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      # 1. Descarrega el codi al runner
      - name: Checkout
        uses: actions/checkout@v4

      # 2. Copia tots els fitxers al servidor via rsync/SSH
      - name: Sync files to server
        uses: burnett01/rsync-deployments@7.0.1
        with:
          switches: -avzr --delete --exclude ".git" --exclude ".github"
          path: ./
          remote_path: /opt/lw-app/
          remote_host: ${{ secrets.SSH_HOST }}
          remote_user: ${{ secrets.SSH_USER }}
          remote_key: ${{ secrets.SSH_KEY }}

      # 3. Escriu el .env al servidor des del secret ENV_FILE
      - name: Write .env from secret
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            set -e
            cd /opt/lw-app
            printf '%s\n' '${{ secrets.ENV_FILE }}' > .env
            sed -i 's/^[[:space:]]*//' .env   # Elimina espais inicials
            chmod 600 .env                    # Protegeix el fitxer

      # 4. Reconstrueix i aixeca el stack de producció
      - name: Compose up
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            set -e
            cd /opt/lw-app
            docker compose -f docker-compose.prod.yml up -d --build
            docker image prune -f   # Neteja imatges antigues
```

### Requisits del servidor de producció

El servidor on es desplega ha de tenir:

- **Docker** i **Docker Compose** instal·lats.
- Un usuari SSH amb accés a `/opt/lw-app/` i permisos per executar Docker.
- El port `22` obert per a connexions SSH des de GitHub Actions.
- Els ports `80` i/o `443` oberts per al trànsit web (Nginx).

---

## Rol de cada usuari

L'aplicació té dos rols ben diferenciats:

### COACH (Entrenador)

| Funcionalitat | Descripció                                                           |
| ------------- | -------------------------------------------------------------------- |
| Dashboard     | Crea, edita i elimina rutines                                        |
| Clients       | Veu la llista de clients, afegeix notes privades, desvincula clients |
| Invitacions   | Genera codis per convidar nous clients                               |
| Assignació    | Assigna rutines als seus clients                                     |

### CLIENT

| Funcionalitat     | Descripció                                               |
| ----------------- | -------------------------------------------------------- |
| Les meves rutines | Veu les rutines assignades pel coach                     |
| El meu coach      | Accepta/rebutja invitacions de coach, pot desvincular-se |
| Entrenar amb amic | Crea o s'uneix a una sala d'entrenament en temps real    |
| Sessió individual | Fa una rutina en solitari amb comptador i resum final    |
| Xat               | Xat en temps real amb el seu coach                       |
