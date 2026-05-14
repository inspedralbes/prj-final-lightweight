## MODIFIED Requirements

### Requirement: TestingService mock covers all Prisma models used by reset()
The Prisma mock used in `testing.service.spec.ts` SHALL include a `liveSession` entry with a `deleteMany` spy so that `TestingService.reset()` can execute without crashing with `Cannot read properties of undefined`.

#### Scenario: reset() completes without TypeError when liveSession mock is present
- **WHEN** `service.reset()` is called in the test
- **THEN** `prisma.liveSession.deleteMany` is called with `{ where: { coachId: { in: ids } } }`
- **AND** no `TypeError: Cannot read properties of undefined` is thrown

#### Scenario: reset() only deletes e2e_ scoped users
- **WHEN** `prisma.user.findMany` returns users with ids [10, 11, 12]
- **THEN** `prisma.user.deleteMany` is called with `{ where: { id: { in: [10, 11, 12] } } }`
- **AND** no unfiltered (no-where) deleteMany is ever issued

#### Scenario: reset() skips all deletes when no e2e_ users exist
- **WHEN** `prisma.user.findMany` returns an empty array
- **THEN** `prisma.invitation.deleteMany`, `prisma.liveSession.deleteMany`, `prisma.routine.deleteMany`, and `prisma.user.deleteMany` are NOT called
- **AND** `seedE2EData` is still called once

#### Scenario: Testability — run testing service tests in isolation
- **WHEN** `npx vitest run src/testing/testing.service.spec.ts` is executed
- **THEN** the command exits with code 0 and reports 0 failed tests
