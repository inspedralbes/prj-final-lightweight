# E2E Critical User Flows - Priority Reference

This document lists the prioritized user flows for E2E test coverage on the LightWeight platform.

## Prioritization Framework

**Criteria:** Impact × Frequency
- **Impact:** Critical business value (revenue, core feature)
- **Frequency:** How often the flow is used by real users

## Priority Levels

| Priority | Description | Test Coverage |
|----------|-------------|--------------|
| P0 | Critical business flows - core platform differentiators | First |
| P1 | High value flows - direct revenue/engagement | Second |
| P2 | Important flows - regular usage | Third |
| P3 | Nice to have - low frequency | Last |

## Prioritized User Flows

| # | Flow | Priority | Module | Notes |
|---|------|----------|--------|-------|
| 1 | Login | P0 | auth | |
| 2 | Client runs solo workout | P0 | workout | |
| 3 | Co-op session (coach creates + client joins) | P0 | session/room | |
| 4 | Registration | P1 | auth | |
| 5 | Invitation acceptance | P1 | invitations | |
| 6 | Video call initiation | P1 | events | |
| 7 | Coach creates routine | P2 | routines | |
| 8 | Coach assigns routine to client | P2 | routines | |
| 9 | Client creates own routine | P2 | routines | |
| 10 | Exercise catalog search | P2 | exercises | |
| 11 | P2P chat | P2 | chat | Realtime only (online) |
| 12 | Coach client list | P2 | clients | |
| 13 | Client profile notes | P2 | clients | |
| 14 | Client views coach info | P3 | client | |
| 15 | Theme switching | P3 | shared | NOT YET IMPLEMENTED |
| 16 | Profile settings | P3 | auth | NOT YET IMPLEMENTED |
| 17 | Notification delivery (offline) | P2 | events | NOT YET IMPLEMENTED |

## Flows Requiring Socket.IO Testing

The following flows require Socket.IO/WebSocket testing due to real-time behavior:

| Flow | Socket Events | Implementation Status |
|------|--------------|----------------------|
| Co-op session | `room:join`, `room:state`, `room:exercise-progress` | ✅ Implemented |
| P2P chat | `chat:send`, `chat:message` | ✅ Implemented (online only) |
| Video call | `video-call-invite`, `video-call-accept`, `webrtc-*` | ✅ Implemented |
| Notifications | `notification:new` | ⚠️ Online only - offline pending |

### Not Yet Implemented (Future Features)

| Flow | Description | Priority |
|------|-------------|----------|
| Theme switching | Dark/light mode toggle | P3 |
| Profile settings | User profile management | P3 |
| Offline notifications | Push notifications when offline | P2 |

## Quarterly Review

This list should be re-evaluated quarterly or before new E2E test implementation phases.

Last updated: 2026-05-06