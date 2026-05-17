## MODIFIED Requirements

### Requirement: InvitationsService rejects duplicate coach assignment with HTTP 409
The `InvitationsService.accept()` method SHALL throw a `ConflictException` (HTTP 409) when the target client already has a coach assigned. Tests MUST assert `ConflictException`, not `BadRequestException`.

#### Scenario: Client already has a coach — service throws ConflictException
- **WHEN** `accept(clientId, code)` is called and the client's `coachId` field is non-null
- **THEN** the method rejects with `ConflictException` (status 409, message "Client already has an assigned coach")
- **AND** no `$transaction` is executed

#### Scenario: Test correctly imports and asserts ConflictException
- **WHEN** `npm test` runs `invitations.service.spec.ts`
- **THEN** the assertion `rejects.toThrow(ConflictException)` passes
- **AND** the test does not import or reference `BadRequestException` for this case

#### Scenario: Testability — run invitations tests in isolation
- **WHEN** `npx vitest run src/invitations/invitations.service.spec.ts` is executed
- **THEN** the command exits with code 0 and reports 0 failed tests
