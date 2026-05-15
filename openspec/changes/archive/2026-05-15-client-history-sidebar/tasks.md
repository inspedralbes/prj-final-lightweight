## 1. Backend — Friend Stats Endpoint

- [x] 1.1 Create `src/back/src/progress/dto/client-friend-stats.dto.ts` with `ClientFriendStatsDto` and `PartnerStatsDto`
- [x] 1.2 Add `getClientFriendStats(clientId)` method to `src/back/src/progress/progress.service.ts`
- [x] 1.3 Add `GET /progress/client/friend-stats` route to `src/back/src/progress/progress.controller.ts` with `ClientGuard`
- [ ] 1.4 Add Jest unit test `src/back/src/progress/progress.service.spec.ts` for `getClientFriendStats`

## 2. Frontend — Service & Types

- [x] 2.1 Add `ClientFriendStats` and `PartnerStats` interfaces to `src/front/src/features/client/services/progressService.ts`
- [x] 2.2 Add `getClientFriendStats()` method to `progressService`

## 3. Frontend — Layout (Sidebar)

- [x] 3.1 Add nav item `{ path: "/client/history", icon: BarChart2, label: t("history.navLabel") }` to `clientNavItems` in `src/front/src/shared/layout/Layout.tsx`

## 4. Frontend — ClientDashboard (Remove Button)

- [x] 4.1 Remove "History & Stats" button block from `src/front/src/features/client/pages/ClientDashboard.tsx` (lines ~211-217)
- [x] 4.2 Remove `navigate` import from ClientDashboard if no longer used elsewhere in the file

## 5. Frontend — ClientHistoryStats (Tabs + Friend Stats Card)

- [x] 5.1 Add filter state (`activeTab: 'all' | 'solo' | 'friend'`) to `ClientHistoryStats`
- [x] 5.2 Render tab buttons (All / Solo / Friend) above the table using `history.tabs.*` i18n keys
- [x] 5.3 Filter `sessions` array based on active tab (solo = no LiveParticipant, friend = has LiveParticipant — this info needs to come from the existing `sessions` endpoint; the current endpoint returns all sessions mixed — add a `isCoop` flag to distinguish)
- [x] 5.4 Fetch and display `ClientFriendStats` (friend stats card) alongside the existing stats counters
- [x] 5.5 Add the Friend Stats card component: `totalCoopSessions`, `totalCoopSets`, `totalCoopExercises`, and `partners` list with username + sessionCount

## 6. Backend — Session Endpoint Enhancement

- [x] 6.1 Modify `getClientOwnSessionHistory` in `progress.service.ts` to add `isCoop: boolean` to each `SessionHistoryItemDto` (true when client appears as `LiveParticipant` in that session)
- [x] 6.2 Update `SessionHistoryItemDto` with optional `isCoop?: boolean` field

## 7. i18n — New Translation Keys

- [x] 7.1 Add tab and friend-stats keys to `src/front/src/i18n/locales/ca.json` under `history.*`
- [x] 7.2 Add tab and friend-stats keys to `src/front/src/i18n/locales/es.json` under `history.*`
- [x] 7.3 Add tab and friend-stats keys to `src/front/src/i18n/locales/en.json` under `history.*`

## 8. Tests / Verification

- [ ] 8.1 Backend: run `npm run lint` and `npm run build` in `src/back`
- [ ] 8.2 Backend: run `npm test` to verify new Jest specs pass
- [ ] 8.3 Frontend: run `npm run lint` in `src/front`
- [x] 8.4 Frontend: run `npm run build` to verify no type errors
- [x] 8.5 Manual QA: log in as CLIENT, verify sidebar shows "Historial i Estadístiques", verify button gone from dashboard
- [x] 8.6 Manual QA: complete a solo session and a co-op session, visit `/client/history`, test All/Solo/Friend tabs filter correctly
- [x] 8.7 Manual QA: verify Friend Stats card shows correct co-op totals and partner name
- [x] 8.8 Manual QA: log in as the other friend user, verify co-op session appears in their history and they see the partner name