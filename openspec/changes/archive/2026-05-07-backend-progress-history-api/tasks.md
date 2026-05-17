## 1. Prisma Schema — Add Completion Stats to LiveSession

- [x] 1.1 Add `completionPercentage Int? @map("completion_percentage")`, `completedSets Int? @map("completed_sets")`, and `completedExercises Int? @map("completed_exercises")` fields to the `LiveSession` model in `src/back/prisma/schema.prisma`
- [x] 1.2 Run `npx prisma migrate dev --name add_completion_stats_to_live_sessions` inside the `lw-backend` container (or locally if DB is accessible) to create the migration file
- [x] 1.3 Verify `npx prisma validate` passes cleanly

## 2. Session Completion — Persist Metrics on Status Update

- [x] 2.1 Create `src/back/src/session/dto/complete-session.dto.ts` with optional fields: `completionPercentage?: number`, `completedSets?: number`, `completedExercises?: number`
- [x] 2.2 Update `SessionService.updateSessionStatus` to accept the optional completion DTO and persist those fields (plus `completedAt: new Date()`) when `status === 'COMPLETED'`
- [x] 2.3 Update `SessionController` PATCH/PUT endpoint to accept and forward the completion DTO body
- [x] 2.4 Add Jest unit test in `session.service.spec.ts`: when `updateSessionStatus` is called with `status = COMPLETED` and completion stats, assert that `prisma.liveSession.update` is called with `completionPercentage`, `completedSets`, `completedExercises`, and `completedAt` in the data payload

## 3. Progress Module — Scaffold

- [x] 3.1 Create directory `src/back/src/progress/` with `progress.module.ts`, `progress.controller.ts`, `progress.service.ts`
- [x] 3.2 Create DTO files: `src/back/src/progress/dto/coach-client-summary.dto.ts`, `session-history-item.dto.ts`, `client-stats.dto.ts`
- [x] 3.3 Register `ProgressModule` in `src/back/src/app.module.ts` imports array

## 4. Progress Module — Coach Endpoints

- [x] 4.1 Implement `ProgressService.getCoachClientsSummary(coachId: number)`: query all COMPLETED `LiveSession` rows where `coachId` matches, group by client (from `LiveParticipant`), return `{ clientId, username, lastSessionAt, totalSessions }`
- [x] 4.2 Implement `ProgressService.getClientSessionHistory(coachId: number, clientId: number)`: query COMPLETED `LiveSession` rows for that coach filtered by client presence in `LiveParticipant`; throw `NotFoundException` if client has no sessions under this coach
- [x] 4.3 Add `GET /progress/coach/clients` controller method with `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(UserRole.COACH)`; returns `CoachClientSummaryDto[]`
- [x] 4.4 Add `GET /progress/coach/client/:clientId` controller method with the same guards; returns `SessionHistoryItemDto[]`
- [x] 4.5 Add `@ApiTags('progress')`, `@ApiBearerAuth()`, `@ApiOperation()`, and `@ApiResponse()` Swagger decorators to both endpoints (skipped — @nestjs/swagger not installed)

## 5. Progress Module — Client Endpoints

- [x] 5.1 Implement `ProgressService.getClientSessionHistory(clientId: number)`: return COMPLETED sessions where `coachId IS NULL AND routine.assignments.some({ clientId })` UNION sessions where client appears in `LiveParticipant` with `participantId = String(clientId)`, ordered by `completedAt DESC`
- [x] 5.2 Implement `ProgressService.getClientStats(clientId: number)`: aggregate `totalSessions` (count), `totalSets` (sum of `completedSets ?? 0`), `totalExercises` (sum of `completedExercises ?? 0`) across all COMPLETED sessions for that client
- [x] 5.3 Add `GET /progress/client/sessions` controller method with `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(UserRole.CLIENT)`; returns `SessionHistoryItemDto[]`
- [x] 5.4 Add `GET /progress/client/stats` controller method with same guards; returns `ClientStatsDto`
- [x] 5.5 Add Swagger decorators to both endpoints (skipped — @nestjs/swagger not installed)

## 6. Tests / Verification

- [x] 6.1 Create `src/back/src/progress/progress.service.spec.ts` with Jest unit tests:
  - `getCoachClientsSummary` returns `[]` when no sessions exist
  - `getClientSessionHistory(coachId, clientId)` throws `NotFoundException` when client not found under coach
  - `getClientStats` returns all-zeros when no completed sessions
  - `getClientStats` treats null `completedSets`/`completedExercises` as 0
- [x] 6.2 Run `npm run lint` in `src/back/` and fix any ESLint errors
- [x] 6.3 Run `npm run build` in `src/back/` and confirm NestJS compiles without errors
- [x] 6.4 Run `npm test` in `src/back/` and confirm all new Jest specs pass
- [x] 6.5 Add manual QA steps to `doc/Proves_usuari.md`:
  - Complete a solo workout as a client, then call `GET /api/progress/client/sessions` and verify the session appears
  - Call `GET /api/progress/client/stats` and verify `totalSessions` incremented
  - As a coach, call `GET /api/progress/coach/clients` and verify the client appears with updated `lastSessionAt`
  - As a coach, call `GET /api/progress/coach/client/:clientId` and verify the session history is returned
- [ ] 6.6 Perform manual smoke test against `http://localhost:3000` (or Docker Compose stack) covering all four endpoints with Postman or curl
