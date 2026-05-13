# Specs: session-progress-persistence

## Notes

This is a **backend-only implementation task** that adds database persistence for data that already exists in-memory during Friend Sessions. No new application requirements are being defined.

### No New Specs Required

The functionality builds on existing specifications:

- **`coop-session`** (existing): Defines how Friend Sessions work - this task adds persistence to it
- **`progress-api`** (existing): The LW-258 API will query the data this task persists

This change adds:
- New Prisma model `SessionProgress`
- Socket.IO event handler to persist progress
- No new REST endpoints
- No new user-facing behavior

### Implementation Only

All requirements are already defined in the design.md. The implementation will:
1. Add `SessionProgress` model to schema.prisma
2. Add `sessionComplete` handler in RoomGateway
3. Create and apply Prisma migration