## 1. Database — Prisma Schema

- [x] 1.1 Add `activeSessionToken String? @map("active_session_token")` field to the `User` model in `src/back/prisma/schema.prisma`
- [x] 1.2 Run `npx prisma migrate dev --name add_active_session_token_to_user` inside the `lw-backend` container (or locally) to generate and apply the migration
- [x] 1.3 Run `npx prisma validate` to confirm schema is clean
- [x] 1.4 Verify the migration file exists under `src/back/prisma/migrations/`

## 2. Backend — AuthService

- [x] 2.1 In `src/back/src/auth/auth.service.ts`, update `login()` to check `user.activeSessionToken` after credential validation — throw `ConflictException('Session already active')` (HTTP 409) if it is non-null
- [x] 2.2 On successful login in `login()`, call `prisma.user.update` to set `activeSessionToken` to the newly issued `access_token`
- [x] 2.3 Add `clearSession(userId: number): Promise<void>` method to `AuthService` that sets `activeSessionToken = null` via `prisma.user.update`
- [x] 2.4 Add `logout(userId: number)` method to `AuthService` that calls `clearSession(userId)` (thin wrapper for future flexibility)

## 3. Backend — AuthController & Logout Endpoint

- [x] 3.1 Add `POST /auth/logout` handler to `src/back/src/auth/auth.controller.ts`, protected with `@UseGuards(JwtAuthGuard)`, extracting `userId` from the JWT payload
- [x] 3.2 Inject `@Request() req` (or use a custom `@GetUser()` decorator) to extract `userId` from JWT payload inside the logout handler
- [x] 3.3 Call `authService.logout(req.user.userId)` and return `{ message: 'Logged out' }`

## 4. Backend — Environment Variable

- [x] 4.1 Add `SESSION_DISCONNECT_TIMEOUT_MS=30000` to `src/back/.env.example` (and root `.env.example` if one exists)
- [x] 4.2 Add a note in the GitHub Actions ENV_FILE template / deployment docs that `SESSION_DISCONNECT_TIMEOUT_MS` is a required env var (default 30 000)

## 5. Backend — EventsGateway (Socket.IO disconnect grace period)

- [x] 5.1 Inject `AuthService` into `EventsGateway` constructor in `src/back/src/events/events.gateway.ts`
- [x] 5.2 Add `private disconnectTimers: Map<number, ReturnType<typeof setTimeout>> = new Map()` to `EventsGateway`
- [x] 5.3 In `handleDisconnect`, after removing from `userSockets`, schedule `authService.clearSession(userId)` after `parseInt(process.env.SESSION_DISCONNECT_TIMEOUT_MS ?? '30000', 10)` ms and store the timer in `disconnectTimers`
- [x] 5.4 In the `register-user` event handler, if `disconnectTimers.has(userId)`, call `clearTimeout` and delete the entry to cancel the pending clearance

## 6. Backend — Tests

- [x] 6.1 In `src/back/src/auth/auth.service.spec.ts`, add a test: `login()` throws `ConflictException` when `prisma.user.findUnique` returns a user with non-null `activeSessionToken`
- [x] 6.2 Add a test: `login()` calls `prisma.user.update` with `{ activeSessionToken: token }` on successful login
- [x] 6.3 Add a test: `clearSession(userId)` calls `prisma.user.update({ where: { id: userId }, data: { activeSessionToken: null } })` exactly once
- [x] 6.4 Run `npm test` inside `src/back/` and confirm all specs pass

## 7. Backend — Lint & Build

- [x] 7.1 Run `npm run lint` inside `src/back/` — fix any ESLint errors
- [x] 7.2 Run `npm run build` inside `src/back/` — confirm NestJS build succeeds

## 8. Frontend — Auth Service & AuthContext

- [x] 8.1 In the frontend login service/page (`src/front/src/features/auth/`), handle HTTP 409 response from `/api/auth/login` and surface the error using i18n key `auth.errors.sessionAlreadyActive`
- [x] 8.2 In `AuthContext` (or the logout utility), update the logout flow to call `POST /api/auth/logout` (with the JWT in Authorization header) before clearing localStorage and redirecting — use a try/catch so that a network failure does not block local cleanup

## 9. Frontend — i18n

- [x] 9.1 Add key `auth.errors.sessionAlreadyActive` to `src/front/src/i18n/locales/ca.json` with value `"Ja tens una sessió activa en un altre dispositiu"`
- [x] 9.2 Add key `auth.errors.sessionAlreadyActive` to `src/front/src/i18n/locales/es.json` with value `"Ya tienes una sesión activa en otro dispositivo"`
- [x] 9.3 Add key `auth.errors.sessionAlreadyActive` to `src/front/src/i18n/locales/en.json` with value `"You already have an active session on another device"`

## 10. Frontend — Lint & Build

- [x] 10.1 Run `npm run lint` inside `src/front/` — fix any ESLint / TypeScript errors
- [x] 10.2 Run `npm run build` inside `src/front/` (`tsc -b && vite build`) — confirm build succeeds

## 11. Tests / Verification

- [x] 11.1 Manual QA — Login with the same account in two different browsers simultaneously; confirm the second browser shows the 409 error message in Catalan
- [x] 11.2 Manual QA — After logout in browser 1, confirm login succeeds in browser 2
- [x] 11.3 Manual QA — Close browser tab (without logout), wait 30 s, confirm login succeeds in a second browser
- [x] 11.4 Manual QA — Verify the logout button now hits the server endpoint (check Network tab: `POST /api/auth/logout` returns 200)
- [x] 11.5 Add the dual-browser session test scenario to `doc/Proves_usuari.md`
- [x] 11.6 Smoke test against production after deploy: https://lightweight.daw.inspedralbes.cat
