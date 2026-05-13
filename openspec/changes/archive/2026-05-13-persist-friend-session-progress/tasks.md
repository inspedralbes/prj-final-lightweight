# Tasks: persist-friend-session-progress

## 1. Prisma Schema

- [x] 1.1 Add `SessionProgress` model to `src/back/prisma/schema.prisma`
- [x] 1.2 Configure relations: sessionId (FK to LiveSession), userId (FK to User)
- [x] 1.3 Add `@@unique([sessionId, userId])` constraint
- [x] 1.4 Add cascade delete: `onDelete: Cascade` for both relations

## 2. Prisma Migration

- [x] 2.1 Generate migration: `docker exec -it lw-backend npx prisma migrate dev --name add_session_progress`
- [x] 2.2 Verify migration file created in `src/back/prisma/migrations/`
- [x] 2.3 Run `npx prisma generate` to update client
- [x] 2.4 Verify schema with `npx prisma validate`

## 3. RoomGateway Implementation

- [x] 3.1 Add `sessionComplete` handler in `src/back/src/room/room.gateway.ts`
- [x] 3.2 Extract LiveSession from roomId (sessionCode)
- [x] 3.3 Create SessionProgress record for each participant
- [x] 3.4 Handle partial progress for abandoned sessions (host disconnect case)
- [x] 3.5 Add error handling and logging

## 4. Backend Verification

- [x] 4.1 Run `npm run build --prefix src/back` to verify compilation
- [x] 4.2 Run `npm run lint --prefix src/back` to verify code style
- [x] 4.3 Verify backend starts successfully with new model

## 5. Tests / Verification

- [x] 5.1 Manual QA: Complete a Friend Session and verify rows exist in `session_progress` table via Adminer
- [x] 5.2 Verify query by sessionId returns correct user progress
- [x] 5.3 Document the new model in project documentation