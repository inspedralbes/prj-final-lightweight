# AGENTS.md — LightWeight

> Guia de referència per a agents d'IA i contribuïdors que implementen nova funcionalitat en aquest projecte.
> Llegeix aquest fitxer **íntegrament** abans de tocar cap fitxer.

---

## Taula de continguts

1. [Arquitectura del projecte](#1-arquitectura-del-projecte)
2. [Stack tecnològic](#2-stack-tecnològic)
3. [Regles no negociables](#3-regles-no-negociables)
4. [Backend: com afegir funcionalitats](#4-backend-com-afegir-funcionalitats)
5. [Frontend: com afegir funcionalitats](#5-frontend-com-afegir-funcionalitats)
6. [Autenticació i guards](#6-autenticació-i-guards)
7. [Base de dades (Prisma)](#7-base-de-dades-prisma)
8. [WebSockets](#8-websockets)
9. [Internacionalització (i18n)](#9-internacionalització-i18n)
10. [Estils (Tailwind CSS 4)](#10-estils-tailwind-css-4)
11. [Icones](#11-icones)
12. [Patrons comuns](#12-patrons-comuns)
13. [Anti-patrons — Què NO fer](#13-anti-patrons--què-no-fer)
14. [Verificació final](#14-verificació-final)

---

## 1. Arquitectura del projecte

```
prj-final-lightweight/
├── src/back/          ← API NestJS (port 3000)
├── src/front/         ← React + Vite (port 5173)
├── nginx/             ← Proxy invers (producció)
├── docker-compose.yml          ← Dev
└── docker-compose.prod.yml     ← Producció
```

**Flux de dades:**

```
Navegador → React (5173) ←──HTTP/WS──► NestJS (3000) ←─Prisma─► PostgreSQL (5432)
```

En producció, només el port 80/443 (Nginx) queda exposat. El backend i la BD no són accessibles directament.

### Rols d'usuari

| Rol      | Descripció                                                         |
| -------- | ------------------------------------------------------------------ |
| `COACH`  | Crea rutines, gestiona clients, genera invitacions                 |
| `CLIENT` | Rep rutines, entrena, pot tenir un sol coach assignat              |

---

## 2. Stack tecnològic

### Backend

| Eina       | Versió | Notes                                                           |
| ---------- | ------ | --------------------------------------------------------------- |
| NestJS     | 11     | HTTP + WS framework. Un domini = un mòdul                       |
| TypeScript | 5.x    | Tipat estricte (`strict: true`)                                 |
| Prisma     | 6      | ORM. Schema a `src/back/prisma/schema.prisma`                   |
| Passport   | —      | Estratègia `jwt`. Guards: `JwtAuthGuard`, `CoachGuard`          |
| Socket.io  | 4      | Gateways a `src/back/src/events/` i `src/back/src/room/`        |

### Frontend

| Eina             | Versió | Notes                                                      |
| ---------------- | ------ | ---------------------------------------------------------- |
| React            | 19     | Components funcionals + hooks. **Sense components de classe** |
| TypeScript       | 5.9    | `verbatimModuleSyntax: true` → requereix `import type`     |
| Vite             | 7      | Bundler. Àlies `@/` → `src/`                               |
| Tailwind CSS     | 4      | Classes utilitàries. **Sense CSS inline ni SCSS**          |
| React Router     | 7      | Enrutament declaratiu a `App.tsx`                          |
| Axios            | 1.13   | Client HTTP. Wrapper a `@/shared/utils/api.ts`             |
| Socket.io-client | 4      | Connexió a `@/features/workout/services/socket.ts`         |
| i18next          | 24     | Fitxers a `@/i18n/locales/{ca,es,en}.json`                 |
| lucide-react     | 0.475  | Biblioteca d'icones principal                              |

---

## 3. Regles no negociables

Aquestes regles s'han de seguir **sense cap excepció**.

### Frontend

1. **Tots els imports usen l'àlies `@/`** (mai `../` o `./` per pujar de directori):

   ```ts
   // ✅ Correcte
   import { api } from "@/shared/utils/api";

   // ❌ Incorrecte
   import { api } from "../../shared/utils/api";
   ```

2. **Arquitectura basada en features** — cada context acotat viu a `features/<nom>/`:

   ```
   features/<nom>/
   ├── pages/       ← pàgines de ruta (components de nivell superior)
   ├── components/  ← components reutilitzables dins la feature
   └── services/    ← lògica de peticions HTTP/WS per a aquesta feature
   ```

3. **Regla de dependències** — en una sola direcció:

   ```
   shared  ←  features/*  ←  App.tsx
   ```

   - `shared/` **mai** importa de `features/`.
   - Una feature **no** importa d'una altra feature directament.
   - Si cal compartir codi entre features, mou-lo a `shared/`.

4. **`import type`** és obligatori per a tipus quan `verbatimModuleSyntax` és actiu:

   ```ts
   // ✅
   import { type FC, useState } from "react";
   import type { MyType } from "@/features/foo/types";

   // ❌ Causa error de build
   import { FC } from "react";
   ```

5. **Mai afegir el token manualment** als serveis; l'interceptor de `api.ts` ja ho fa. No obstant, els serveis que usen `axios` directament (no el wrapper `api`) han d'afegir-lo manualment via `authHeader()`.

6. **Noves pàgines** → afegeix la `<Route>` corresponent a `App.tsx` dins el `<ProtectedRoute>` adequat.

### Backend

1. **Un domini = un mòdul NestJS** a `src/back/src/<nom>/`. Registra'l a `AppModule`.

2. **Les rutes estàtiques SEMPRE abans de les dinàmiques** dins d'un controlador:

   ```ts
   // ✅ Ordre correcte
   @Get('global')         // ← primer l'estàtica
   @Get('my-routines')    // ← primer l'estàtica
   @Get(':id')            // ← la dinàmica al final
   ```

3. **`req.user.userId`** és la propietat exposada pel payload JWT processada pel guard. Utilitza sempre aquest camp per obtenir l'usuari autenticat, no `req.user.id`.

4. **Errors HTTP explícits**: llança `HttpException` o excepcions específiques de NestJS (`NotFoundException`, `ForbiddenException`, etc.) en lloc de deixar que els errors es propaguin sense gestionar.

5. **DTOs per a tots els paràmetres `@Body()`**. Crea un fitxer `dto/create-<nom>.dto.ts` o `dto/update-<nom>.dto.ts` per a cada operació d'entrada.

---

## 4. Backend: com afegir funcionalitats

### Estructura d'un mòdul NestJS

Per a cada nou domini (p. ex. `diets`), crea:

```
src/back/src/diets/
├── diets.module.ts
├── diets.controller.ts
├── diets.service.ts
└── dto/
    ├── create-diet.dto.ts
    └── update-diet.dto.ts
```

### Plantilla de mòdul

```ts
// diets.module.ts
import { Module } from "@nestjs/common";
import { DietsController } from "./diets.controller";
import { DietsService } from "./diets.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [DietsController],
  providers: [DietsService],
})
export class DietsModule {}
```

### Plantilla de controlador

```ts
// diets.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { DietsService } from "./diets.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CoachGuard } from "../auth/guards/coach.guard";
import { CreateDietDto } from "./dto/create-diet.dto";

@Controller("diets")
export class DietsController {
  constructor(private dietsService: DietsService) {}

  // Rutes estàtiques primer ↓
  @Get("my-diets")
  @UseGuards(JwtAuthGuard)
  async getMyDiets(@Request() req: any) {
    return this.dietsService.getDietsForClient(req.user.userId);
  }

  // Rutes dinàmiques al final ↓
  @Get(":id")
  @UseGuards(JwtAuthGuard)
  async getById(@Param("id") id: string) {
    return this.dietsService.getDietById(Number(id));
  }

  @Post()
  @UseGuards(CoachGuard) // Només COACH
  async create(@Request() req: any, @Body() dto: CreateDietDto) {
    return this.dietsService.createDiet(req.user.userId, dto);
  }
}
```

### Plantilla de servei

```ts
// diets.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDietDto } from "./dto/create-diet.dto";

@Injectable()
export class DietsService {
  constructor(private prisma: PrismaService) {}

  async getDietById(id: number) {
    const diet = await this.prisma.dietPlan.findUnique({ where: { id } });
    if (!diet) throw new NotFoundException(`Diet ${id} not found`);
    return diet;
  }

  async createDiet(coachId: number, dto: CreateDietDto) {
    return this.prisma.dietPlan.create({
      data: { coachId, name: dto.name },
    });
  }
}
```

### Registrar el mòdul a AppModule

```ts
// app.module.ts — afegir a imports[]
import { DietsModule } from "./diets/diets.module";

@Module({
  imports: [
    // ... mòduls existents ...
    DietsModule, // ← afegir aquí
  ],
})
export class AppModule {}
```

### Guards disponibles

| Guard              | Fitxer                          | Ús                                           |
| ------------------ | ------------------------------- | -------------------------------------------- |
| `JwtAuthGuard`     | `auth/guards/jwt-auth.guard.ts` | Qualsevol usuari autenticat                  |
| `CoachGuard`       | `auth/guards/coach.guard.ts`    | Exclusiu per a `role === 'COACH'`            |
| `AuthGuard('jwt')` | passport                        | Equivalent a `JwtAuthGuard` (ús directe)     |

---

## 5. Frontend: com afegir funcionalitats

### Afegir una nova feature completa

Suposem que volem afegir `diets`:

```
src/front/src/features/diets/
├── pages/
│   ├── CoachDietList.tsx     ← pàgina per al COACH
│   └── ClientDietView.tsx    ← pàgina per al CLIENT
├── components/
│   └── DietCard.tsx
└── services/
    └── dietService.ts
```

### Plantilla de servei (usa el wrapper `api`)

```ts
// features/diets/services/dietService.ts
import { api } from "@/shared/utils/api";

export interface Diet {
  id: number;
  name: string;
  coachId: number;
}

export const dietService = {
  async getMyDiets(): Promise<Diet[]> {
    const { data } = await api.get("/diets/my-diets");
    return data;
  },

  async createDiet(name: string): Promise<Diet> {
    const { data } = await api.post("/diets", { name });
    return data;
  },
};
```

> ⚠️ El wrapper `api` (de `@/shared/utils/api`) afegeix el token JWT automàticament. No l'afegeixis manualment. Si per algun motiu uses `axios` directament, has d'afegir `{ headers: { Authorization: \`Bearer \${localStorage.getItem('token')}\` } }`.

### Plantilla de pàgina

```tsx
// features/diets/pages/CoachDietList.tsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { dietService, type Diet } from "@/features/diets/services/dietService";

export default function CoachDietList() {
  const { t } = useTranslation();
  const [diets, setDiets] = useState<Diet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dietService
      .getMyDiets()
      .then(setDiets)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div>{t("common.loading")}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{t("diets.title")}</h1>
      {diets.map((diet) => (
        <div key={diet.id}>{diet.name}</div>
      ))}
    </div>
  );
}
```

### Registrar la ruta a App.tsx

```tsx
// App.tsx — afegir l'import i la <Route>
import CoachDietList from "@/features/diets/pages/CoachDietList";

// Dins del bloc <Routes>, dins del <ProtectedRoute> adequat:
<Route path="/diets" element={<CoachDietList />} />;
```

### Afegir l'entrada al sidebar (Layout.tsx)

```tsx
// shared/layout/Layout.tsx
import { Salad } from "lucide-react"; // ← tria la icona adequada

const coachNavItems = [
  // ... elements existents ...
  { to: "/diets", icon: Salad, label: t("nav.diets") },
];
```

### Accedir a l'usuari autenticat

```tsx
import { useAuth } from "@/features/auth/context/AuthContext";

function MyComponent() {
  const { user } = useAuth();
  // user.id, user.role ("COACH" | "CLIENT"), user.username, user.coachId
}
```

---

## 6. Autenticació i guards

### Com funciona

1. En iniciar sessió, el backend retorna un JWT `access_token` i dades de l'usuari.
2. El frontend emmagatzema `token`, `userRole`, `username`, `userId`, `coachId` a `localStorage`.
3. `AuthContext` els llegeix en muntar-se i exposa `user` a tot l'arbre de components.
4. L'interceptor axios a `api.ts` afegeix `Authorization: Bearer <token>` a cada petició.
5. Si el backend retorna `401`, l'interceptor neteja `localStorage` i redirigeix a `/login`.

### ProtectedRoute

```tsx
// App.tsx — com es protegeix una ruta
<Route element={<ProtectedRoute allowedRoles={["COACH"]} />}>
  <Route path="/dashboard" element={<CoachDashboard />} />
</Route>

<Route element={<ProtectedRoute allowedRoles={["CLIENT"]} />}>
  <Route path="/client-home" element={<ClientDashboard />} />
</Route>

// Per a rutes accessibles per tots dos rols:
<Route element={<ProtectedRoute allowedRoles={["COACH", "CLIENT"]} />}>
  <Route path="/diets" element={<CoachDietList />} />
</Route>
```

### Logout

```tsx
const { logout } = useAuth();
// logout() neteja localStorage + estat de l'usuari. L'app redirigeix a /login automàticament.
```

---

## 7. Base de dades (Prisma)

### Ubicació del schema

```
src/back/prisma/schema.prisma
```

### Models principals i camps clau

| Model               | Camps clau                                                          |
| ------------------- | ------------------------------------------------------------------- |
| `User`              | `id`, `username`, `email`, `role` (COACH/CLIENT), `coachId`         |
| `Routine`           | `id`, `coachId`, `name`, `isPublic`                                 |
| `RoutineExercise`   | `routineId`, `exerciseId`, `sets`, `reps`, `rest`, `order`          |
| `RoutineAssignment` | `routineId`, `clientId` (PK compost únic)                           |
| `ExerciseCatalog`   | `id`, `name`, `category`, `primaryMuscle[]`                         |
| `Invitation`        | `id`, `coachId`, `code`, `status`, `targetClientId`                 |
| `ClientProfile`     | `clientId` (1:1 amb User), `privateNotes`, `goals`                  |
| `P2PChatMessage`    | `senderId`, `receiverId`, `text`, `read`                            |
| `LiveSession`       | `coachId`, `routineId`, `sessionCode`, `status`                     |

### Com crear o modificar entitats

1. Edita `schema.prisma`.
2. Crea la migració:
   ```bash
   docker exec -it lw-backend sh
   npx prisma migrate dev --name descriu_el_canvi
   ```
3. Regenera el client:
   ```bash
   npx prisma generate
   ```
4. El client Prisma s'injecta via `PrismaService` als serveis NestJS:

   ```ts
   constructor(private prisma: PrismaService) {}

   // Exemple d'ús
   const user = await this.prisma.user.findUnique({ where: { id } });
   ```

### Cascades

`onDelete: Cascade` està configurat per a:

- `RoutineExercise` → `Routine`
- `RoutineAssignment` → `Routine` i `User`
- `ClientProfile` → `User`
- Missatges de xat → `User` i `LiveSession`

Si afegeixes noves relacions que depenen de `User` o `Routine`, considera afegir `onDelete: Cascade` per evitar inconsistències de dades.

---

## 8. WebSockets

### Arquitectura WS

```
Client (socket.ts)  ──connect──►  EventsGateway (events.gateway.ts)
                                       │
                                  RoomGateway (room.gateway.ts)
```

### Connexió al frontend

```ts
// @/features/workout/services/socket.ts
// La instància del socket és un singleton. Importa-la directament:
import { socket } from "@/features/workout/services/socket";

// Emetre un event
socket.emit("join-room", { roomId: "abc" });

// Escoltar un event
socket.on("room-state", (data) => { ... });

// Neteja sempre els listeners a l'useEffect cleanup:
useEffect(() => {
  socket.on("my-event", handler);
  return () => { socket.off("my-event", handler); }; // ← obligatori
}, []);
```

### Registrar l'usuari al socket (ja gestionat a App.tsx)

```ts
// App.tsx ja fa:
socket.emit("register-user", user.id);
// Això permet al backend enviar events dirigits a un usuari específic.
```

### Notificacions P2P (patró existent)

El backend emet `p2p-message-notification` quan arriba un missatge P2P. `App.tsx` l'escolta i crida `addNotification()` de `NotificationContext`. Per a nous tipus de notificació, segueix el mateix patró.

---

## 9. Internacionalització (i18n)

### Idiomes suportats

`ca` (Català, per defecte), `es` (Castellà), `en` (Anglès).

### Fitxers de traducció

```
src/front/src/i18n/locales/
├── ca.json   ← Català (per defecte)
├── es.json
└── en.json
```

### Ús als components

```tsx
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t("diets.title")}</h1>;
}
```

### Regla: totes les cadenes visibles per l'usuari han d'estar als fitxers de traducció

```json
// ca.json — afegir noves claus
{
  "diets": {
    "title": "Dietes",
    "empty": "No hi ha dietes assignades",
    "create": "Crear dieta"
  }
}
```

Copia la mateixa clau a `es.json` i `en.json` amb la traducció corresponent.

---

## 10. Estils (Tailwind CSS 4)

- Usa **només classes Tailwind**. Sense `style={{}}` inline ni nous fitxers `.css`.
- El tema (colors, mode fosc) es gestiona via `ThemeContext`, que afegeix/elimina la classe `dark` a `<html>`.
- Estructura estàndard de targeta:
  ```tsx
  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow flex flex-col gap-3">
    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">...</h2>
    <div className="flex-1">...</div>
    <div className="mt-auto flex gap-2">
      <button className="btn-primary">...</button>
    </div>
  </div>
  ```
- Per alinear botons al **final** d'una targeta d'alçada variable: `flex flex-col` al contenidor + `flex-1` al cos + `mt-auto` als botons.

---

## 11. Icones

Usa **`lucide-react`** com a primera opció:

```tsx
import { Dumbbell, ClipboardList, Users, LayoutDashboard } from "lucide-react";

<ClipboardList className="w-5 h-5" />;
```

Les icones personalitzades (no disponibles a lucide) estan a `@/shared/components/Icons.tsx`. Afegeix-les allà si cal.

**Icones actuals del sidebar:**

| Secció                  | Icona                               | Rol            |
| ----------------------- | ----------------------------------- | -------------- |
| Dashboard / Rutines     | `LayoutDashboard` / `ClipboardList` | COACH / CLIENT |
| Clients                 | `Users`                             | COACH          |
| El meu coach            | `UserCheck`                         | CLIENT         |
| Entrenar amb amic       | `Swords`                            | CLIENT         |

---

## 12. Patrons comuns

### Obtenir dades en una pàgina

```tsx
const [data, setData] = useState<MyType[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  myService
    .getAll()
    .then(setData)
    .catch(() => setError("Error carregant les dades"))
    .finally(() => setIsLoading(false));
}, []);

if (isLoading) return <LoadingScreen />;
if (error) return <p className="text-red-500">{error}</p>;
```

### Toast (notificació emergent)

```tsx
import { useToast } from "@/shared/hooks/useToast";

const { showToast } = useToast();

// Ús
showToast("Operació completada", "success");
showToast("Error inesperat", "error");
```

### Modal de confirmació

```tsx
import ConfirmModal from "@/shared/components/ConfirmModal";

<ConfirmModal
  isOpen={showConfirm}
  message="Estàs segur que vols eliminar això?"
  onConfirm={handleDelete}
  onCancel={() => setShowConfirm(false)}
/>;
```

---

## 13. Anti-patrons — Què NO fer

| Anti-patró                                                            | Per què és problemàtic                               | Alternativa                                              |
| --------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| Importar entre features (`features/a` importa de `features/b`)        | Viola la regla de dependències, crea acoblament fort | Mou el codi compartit a `shared/`                        |
| Usar `import { FC } from "react"` sense `type`                        | Falla amb `verbatimModuleSyntax`                     | `import { type FC } from "react"`                        |
| Posar rutes dinàmiques (`:id`) abans de les estàtiques en un controlador | NestJS/Express tracta el nom estàtic com un ID      | Les rutes estàtiques sempre primer                       |
| Cridar `localStorage.getItem('token')` manualment als components      | Trenca l'encapsulació de l'autenticació              | `useAuth().user.token` o deixa que ho gestioni l'interceptor |
| Afegir estils inline (`style={{color: 'red'}}`)                       | Inconsistent amb el sistema de disseny               | Classes Tailwind equivalents                             |
| Crear nous serveis que no usen `api.ts` (sense justificació)          | Perd la gestió automàtica de token i del 401         | Usa `api` de `@/shared/utils/api`                        |
| Codi mort o variables no usades en TypeScript                         | Error de build (`TS6133`)                            | Elimina o usa el prefix `_` si és un paràmetre necessari |
| Modificar `schema.prisma` sense crear una migració                    | La BD i el schema queden desincronitzats             | `npx prisma migrate dev --name <nom>`                    |
| Afegir un mòdul NestJS sense registrar-lo a `AppModule`               | El mòdul no existeix en temps d'execució             | Afegeix-lo a `imports[]` d'`AppModule`                   |
| Cadenes hardcoded als components (`<p>Loading...</p>`)                | No funciona en altres idiomes                        | `t("common.loading")` amb la clau als tres fitxers i18n  |

---

## 14. Verificació final

Abans de considerar qualsevol implementació completa, verifica:

### Frontend

```bash
cd src/front

# 1. Comprovació de tipus TypeScript (sense emetre fitxers)
npx tsc --noEmit

# 2. Build de producció (ha de finalitzar sense errors)
npm run build

# 3. Linting
npm run lint
```

### Backend

```bash
cd src/back

# 1. Validar el schema Prisma
docker exec -it lw-backend npx prisma validate

# 2. Build TypeScript
npm run build
```

### Llista de verificació conceptual

- [ ] Tots els imports usen `@/` (frontend)
- [ ] Cap import entre features (frontend)
- [ ] `import type` per a tipus (frontend)
- [ ] Nova ruta afegida a `App.tsx` i al sidebar si correspon
- [ ] Nou mòdul registrat a `AppModule` (backend)
- [ ] Rutes estàtiques abans de les dinàmiques (backend)
- [ ] Nova migració Prisma si el schema s'ha modificat
- [ ] Traduccions afegides als 3 fitxers (ca, es, en)
- [ ] `tsc --noEmit` i `npm run build` passen sense errors
