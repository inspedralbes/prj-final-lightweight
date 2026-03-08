# AGENTS.md — LightWeight

> Reference guide for AI agents and contributors implementing new functionality in this project.  
> Read this file **in full** before touching any file.

---

## Table of Contents

1. [Project Architecture](#1-project-architecture)
2. [Tech Stack](#2-tech-stack)
3. [Non-Negotiable Rules](#3-non-negotiable-rules)
4. [Back-end: How to Add Features](#4-back-end-how-to-add-features)
5. [Front-end: How to Add Features](#5-front-end-how-to-add-features)
6. [Authentication & Guards](#6-authentication--guards)
7. [Database (Prisma)](#7-database-prisma)
8. [WebSockets](#8-websockets)
9. [Internationalisation (i18n)](#9-internationalisation-i18n)
10. [Styles (Tailwind CSS 4)](#10-styles-tailwind-css-4)
11. [Icons](#11-icons)
12. [Common Patterns](#12-common-patterns)
13. [Anti-patterns — What NOT to Do](#13-anti-patterns--what-not-to-do)
14. [Final Verification](#14-final-verification)

---

## 1. Project Architecture

```
prj-final-lightweight/
├── src/back/          ← NestJS API (port 3000)
├── src/front/         ← React + Vite (port 5173)
├── nginx/             ← Reverse proxy (production)
├── docker-compose.yml          ← Dev
└── docker-compose.prod.yml     ← Production
```

**Data flow:**

```
Browser → React (5173) ←──HTTP/WS──► NestJS (3000) ←─Prisma─► PostgreSQL (5432)
```

In production, only port 80/443 (Nginx) is exposed. The backend and DB are not directly accessible.

### User Roles

| Role     | Description                                                 |
| -------- | ----------------------------------------------------------- |
| `COACH`  | Creates routines, manages clients, generates invitations    |
| `CLIENT` | Receives routines, trains, can have a single assigned coach |

---

## 2. Tech Stack

### Back-end

| Tool       | Version | Notes                                                       |
| ---------- | ------- | ----------------------------------------------------------- |
| NestJS     | 11      | HTTP + WS framework. One domain = one module                |
| TypeScript | 5.x     | Strict typing (`strict: true`)                              |
| Prisma     | 6       | ORM. Schema at `src/back/prisma/schema.prisma`              |
| Passport   | —       | `jwt` strategy. Guards: `JwtAuthGuard`, `CoachGuard`        |
| Socket.io  | 4       | Gateways at `src/back/src/events/` and `src/back/src/room/` |

### Front-end

| Tool             | Version | Notes                                                  |
| ---------------- | ------- | ------------------------------------------------------ |
| React            | 19      | Functional components + hooks. **No class components** |
| TypeScript       | 5.9     | `verbatimModuleSyntax: true` → requires `import type`  |
| Vite             | 7       | Bundler. Alias `@/` → `src/`                           |
| Tailwind CSS     | 4       | Utility classes. **No inline CSS or SCSS**             |
| React Router     | 7       | Declarative routing in `App.tsx`                       |
| Axios            | 1.13    | HTTP client. Wrapper at `@/shared/utils/api.ts`        |
| Socket.io-client | 4       | Connection at `@/features/workout/services/socket.ts`  |
| i18next          | 24      | Files at `@/i18n/locales/{ca,es,en}.json`              |
| lucide-react     | 0.475   | Primary icon library                                   |

---

## 3. Non-Negotiable Rules

These rules must be followed **without exception**.

### Front-end

1. **All imports use the `@/` alias** (never `../` or `./` to navigate up directories):

   ```ts
   // ✅ Correct
   import { api } from "@/shared/utils/api";

   // ❌ Wrong
   import { api } from "../../shared/utils/api";
   ```

2. **Feature-based architecture** — each bounded context lives in `features/<name>/`:

   ```
   features/<name>/
   ├── pages/       ← route-level pages (top-level components)
   ├── components/  ← reusable components within the feature
   └── services/    ← HTTP/WS request logic for this feature
   ```

3. **Dependency rule** — one direction only:

   ```
   shared  ←  features/*  ←  App.tsx
   ```

   - `shared/` **never** imports from `features/`.
   - One feature **does not** import from another feature directly.
   - If code needs to be shared between features, move it to `shared/`.

4. **`import type`** is mandatory for types when `verbatimModuleSyntax` is active:

   ```ts
   // ✅
   import { type FC, useState } from "react";
   import type { MyType } from "@/features/foo/types";

   // ❌ Causes build error
   import { FC } from "react";
   ```

5. **Never add the token manually** in services; the `api.ts` interceptor already does it. However, services that use `axios` directly (not the `api` wrapper) must add it manually via `authHeader()`.

6. **New pages** → add the corresponding `<Route>` in `App.tsx` inside the appropriate `<ProtectedRoute>`.

### Back-end

1. **One domain = one NestJS module** at `src/back/src/<name>/`. Register it in `AppModule`.

2. **Static routes ALWAYS before dynamic ones** inside a controller:

   ```ts
   // ✅ Correct order
   @Get('global')         // ← static first
   @Get('my-routines')    // ← static first
   @Get(':id')            // ← dynamic last
   ```

3. **`req.user.userId`** is the property exposed by the JWT payload processed by the guard. Always use this field to get the authenticated user, not `req.user.id`.

4. **Explicit HTTP errors**: throw `HttpException` or NestJS-specific exceptions (`NotFoundException`, `ForbiddenException`, etc.) instead of letting errors propagate unhandled.

5. **DTOs for all `@Body()` parameters**. Create a `dto/create-<name>.dto.ts` or `dto/update-<name>.dto.ts` file for each input operation.

---

## 4. Back-end: How to Add Features

### NestJS module structure

For each new domain (e.g. `diets`), create:

```
src/back/src/diets/
├── diets.module.ts
├── diets.controller.ts
├── diets.service.ts
└── dto/
    ├── create-diet.dto.ts
    └── update-diet.dto.ts
```

### Module template

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

### Controller template

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

  // Static routes first ↓
  @Get("my-diets")
  @UseGuards(JwtAuthGuard)
  async getMyDiets(@Request() req: any) {
    return this.dietsService.getDietsForClient(req.user.userId);
  }

  // Dynamic routes last ↓
  @Get(":id")
  @UseGuards(JwtAuthGuard)
  async getById(@Param("id") id: string) {
    return this.dietsService.getDietById(Number(id));
  }

  @Post()
  @UseGuards(CoachGuard) // COACH only
  async create(@Request() req: any, @Body() dto: CreateDietDto) {
    return this.dietsService.createDiet(req.user.userId, dto);
  }
}
```

### Service template

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

### Register the module in AppModule

```ts
// app.module.ts — add to imports[]
import { DietsModule } from "./diets/diets.module";

@Module({
  imports: [
    // ... existing modules ...
    DietsModule, // ← add here
  ],
})
export class AppModule {}
```

### Available guards

| Guard              | File                            | Usage                                     |
| ------------------ | ------------------------------- | ----------------------------------------- |
| `JwtAuthGuard`     | `auth/guards/jwt-auth.guard.ts` | Any authenticated user                    |
| `CoachGuard`       | `auth/guards/coach.guard.ts`    | Exclusive to `role === 'COACH'`           |
| `AuthGuard('jwt')` | passport                        | Equivalent to `JwtAuthGuard` (direct use) |

---

## 5. Front-end: How to Add Features

### Adding a complete new feature

Suppose we want to add `diets`:

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

### Service template (uses the `api` wrapper)

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

> ⚠️ The `api` wrapper (from `@/shared/utils/api`) adds the JWT token automatically. Do not add it manually. If for some reason you use `axios` directly, you must add `{ headers: { Authorization: \`Bearer \${localStorage.getItem('token')}\` } }`.

### Page template

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

### Register the route in App.tsx

```tsx
// App.tsx — add the import and the <Route>
import CoachDietList from "@/features/diets/pages/CoachDietList";

// Inside the <Routes> block, inside the appropriate <ProtectedRoute>:
<Route path="/diets" element={<CoachDietList />} />;
```

### Add the sidebar entry (Layout.tsx)

```tsx
// shared/layout/Layout.tsx
import { Salad } from "lucide-react"; // ← choose the appropriate icon

const coachNavItems = [
  // ... existing items ...
  { to: "/diets", icon: Salad, label: t("nav.diets") },
];
```

### Accessing the authenticated user

```tsx
import { useAuth } from "@/features/auth/context/AuthContext";

function MyComponent() {
  const { user } = useAuth();
  // user.id, user.role ("COACH" | "CLIENT"), user.username, user.coachId
}
```

---

## 6. Authentication & Guards

### How it works

1. On login, the backend returns a JWT `access_token` and user data.
2. The frontend stores `token`, `userRole`, `username`, `userId`, `coachId` in `localStorage`.
3. `AuthContext` reads it on mount and exposes `user` to the entire component tree.
4. The axios interceptor in `api.ts` adds `Authorization: Bearer <token>` to every request.
5. If the backend returns `401`, the interceptor clears `localStorage` and redirects to `/login`.

### ProtectedRoute

```tsx
// App.tsx — how a route is protected
<Route element={<ProtectedRoute allowedRoles={["COACH"]} />}>
  <Route path="/dashboard" element={<CoachDashboard />} />
</Route>

<Route element={<ProtectedRoute allowedRoles={["CLIENT"]} />}>
  <Route path="/client-home" element={<ClientDashboard />} />
</Route>

// For routes accessible by both roles:
<Route element={<ProtectedRoute allowedRoles={["COACH", "CLIENT"]} />}>
  <Route path="/diets" element={<CoachDietList />} />
</Route>
```

### Logout

```tsx
const { logout } = useAuth();
// logout() clears localStorage + user state. The app redirects to /login automatically.
```

---

## 7. Database (Prisma)

### Schema location

```
src/back/prisma/schema.prisma
```

### Main models and key fields

| Model               | Key fields                                                  |
| ------------------- | ----------------------------------------------------------- |
| `User`              | `id`, `username`, `email`, `role` (COACH/CLIENT), `coachId` |
| `Routine`           | `id`, `coachId`, `name`, `isPublic`                         |
| `RoutineExercise`   | `routineId`, `exerciseId`, `sets`, `reps`, `rest`, `order`  |
| `RoutineAssignment` | `routineId`, `clientId` (unique composite PK)               |
| `ExerciseCatalog`   | `id`, `name`, `category`, `primaryMuscle[]`                 |
| `Invitation`        | `id`, `coachId`, `code`, `status`, `targetClientId`         |
| `ClientProfile`     | `clientId` (1:1 with User), `privateNotes`, `goals`         |
| `P2PChatMessage`    | `senderId`, `receiverId`, `text`, `read`                    |
| `LiveSession`       | `coachId`, `routineId`, `sessionCode`, `status`             |

### How to create or modify entities

1. Edit `schema.prisma`.
2. Create the migration:
   ```bash
   docker exec -it lw-backend sh
   npx prisma migrate dev --name describe_the_change
   ```
3. Regenerate the client:
   ```bash
   npx prisma generate
   ```
4. The Prisma client is injected via `PrismaService` in NestJS services:

   ```ts
   constructor(private prisma: PrismaService) {}

   // Usage example
   const user = await this.prisma.user.findUnique({ where: { id } });
   ```

### Cascades

`onDelete: Cascade` is configured for:

- `RoutineExercise` → `Routine`
- `RoutineAssignment` → `Routine` and `User`
- `ClientProfile` → `User`
- Chat messages → `User` and `LiveSession`

If you add new relations that depend on `User` or `Routine`, consider adding `onDelete: Cascade` to avoid data inconsistencies.

---

## 8. WebSockets

### WS architecture

```
Client (socket.ts)  ──connect──►  EventsGateway (events.gateway.ts)
                                       │
                                  RoomGateway (room.gateway.ts)
```

### Front-end connection

```ts
// @/features/workout/services/socket.ts
// The socket instance is a singleton. Import it directly:
import { socket } from "@/features/workout/services/socket";

// Emit an event
socket.emit("join-room", { roomId: "abc" });

// Listen to an event
socket.on("room-state", (data) => { ... });

// Always clean up listeners in the useEffect cleanup:
useEffect(() => {
  socket.on("my-event", handler);
  return () => { socket.off("my-event", handler); }; // ← mandatory
}, []);
```

### Registering the user on the socket (already handled in App.tsx)

```ts
// App.tsx already does:
socket.emit("register-user", user.id);
// This allows the backend to send events targeted at a specific user.
```

### P2P notifications (existing pattern)

The backend emits `p2p-message-notification` when a P2P message arrives. `App.tsx` listens to it and calls `addNotification()` from `NotificationContext`. For new notification types, follow the same pattern.

---

## 9. Internationalisation (i18n)

### Supported languages

`ca` (Catalan, default), `es` (Spanish), `en` (English).

### Translation files

```
src/front/src/i18n/locales/
├── ca.json   ← Catalan (default)
├── es.json
└── en.json
```

### Usage in components

```tsx
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t("diets.title")}</h1>;
}
```

### Rule: all user-visible strings must be in the translation files

```json
// ca.json — add new keys
{
  "diets": {
    "title": "Dietes",
    "empty": "No hi ha dietes assignades",
    "create": "Crear dieta"
  }
}
```

Copy the same key to `es.json` and `en.json` with the corresponding translation.

---

## 10. Styles (Tailwind CSS 4)

- Use **only Tailwind classes**. No `style={{}}` inline or new `.css` files.
- The theme (colors, dark mode) is managed via `ThemeContext`, which adds/removes the `dark` class on `<html>`.
- Standard card structure:
  ```tsx
  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow flex flex-col gap-3">
    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">...</h2>
    <div className="flex-1">...</div>
    <div className="mt-auto flex gap-2">
      <button className="btn-primary">...</button>
    </div>
  </div>
  ```
- To align buttons at the **bottom** of a variable-height card: `flex flex-col` on the container + `flex-1` on the body + `mt-auto` on the buttons.

---

## 11. Icons

Use **`lucide-react`** as the first option:

```tsx
import { Dumbbell, ClipboardList, Users, LayoutDashboard } from "lucide-react";

<ClipboardList className="w-5 h-5" />;
```

Custom icons (not available in lucide) are at `@/shared/components/Icons.tsx`. Add them there if needed.

**Current sidebar icons:**

| Section              | Icon                                | Role           |
| -------------------- | ----------------------------------- | -------------- |
| Dashboard / Routines | `LayoutDashboard` / `ClipboardList` | COACH / CLIENT |
| Clients              | `Users`                             | COACH          |
| My coach             | `UserCheck`                         | CLIENT         |
| Train with friend    | `Swords`                            | CLIENT         |

---

## 12. Common Patterns

### Fetching data in a page

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

````

### Toast (pop-up notification)

```tsx
import { useToast } from "@/shared/hooks/useToast";

const { showToast } = useToast();

// Usage
showToast("Operation completed", "success");
showToast("Unexpected error", "error");
````

### Confirmation modal

```tsx
import ConfirmModal from "@/shared/components/ConfirmModal";

<ConfirmModal
  isOpen={showConfirm}
  message="Are you sure you want to delete this?"
  onConfirm={handleDelete}
  onCancel={() => setShowConfirm(false)}
/>;
```

---

## 13. Anti-patterns — What NOT to Do

| Anti-pattern                                                          | Why it is problematic                                | Alternative                                             |
| --------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------- |
| Importing between features (`features/a` imports from `features/b`)   | Violates the dependency rule, creates tight coupling | Move shared code to `shared/`                           |
| Using `import { FC } from "react"` without `type`                     | Fails with `verbatimModuleSyntax`                    | `import { type FC } from "react"`                       |
| Placing dynamic routes (`:id`) before static ones in a controller     | NestJS/Express treats the static name as an ID       | Static routes always first                              |
| Calling `localStorage.getItem('token')` manually in components        | Breaks authentication encapsulation                  | `useAuth().user.token` or let the interceptor handle it |
| Adding inline styles (`style={{color: 'red'}}`)                       | Inconsistent with the design system                  | Equivalent Tailwind classes                             |
| Creating new services that don't use `api.ts` (without justification) | Loses automatic token management and 401 handling    | Use `api` from `@/shared/utils/api`                     |
| Dead code or unused variables in TypeScript                           | Build error (`TS6133`)                               | Remove or use `_` prefix if it's a required parameter   |
| Modifying `schema.prisma` without creating a migration                | DB and schema become out of sync                     | `npx prisma migrate dev --name <name>`                  |
| Adding a NestJS module without registering it in `AppModule`          | The module does not exist at runtime                 | Add to `imports[]` in `AppModule`                       |
| Hardcoded strings in components (`<p>Loading...</p>`)                 | Does not work in other languages                     | `t("common.loading")` with the key in all i18n files    |

---

## 14. Final Verification

Before considering any implementation complete, verify:

### Front-end

```bash
cd src/front

# 1. TypeScript type check (without emitting files)
npx tsc --noEmit

# 2. Production build (must finish without errors)
npm run build

# 3. Linting
npm run lint
```

### Back-end

```bash
cd src/back

# 1. Validate Prisma schema
docker exec -it lw-backend npx prisma validate

# 2. TypeScript build
npm run build
```

### Conceptual checklist

- [ ] All imports use `@/` (front-end)
- [ ] No cross-feature imports (front-end)
- [ ] `import type` for types (front-end)
- [ ] New route added to `App.tsx` and to the sidebar if applicable
- [ ] New module registered in `AppModule` (back-end)
- [ ] Static routes before dynamic ones (back-end)
- [ ] New Prisma migration if the schema was modified
- [ ] Translations added to all 3 files (ca, es, en)
- [ ] `tsc --noEmit` and `npm run build` pass without errors
