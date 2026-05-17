## MODIFIED Requirements

### Requirement: AuthService unit test suite is parseable and fully executable
The `auth.service.spec.ts` file SHALL be syntactically valid TypeScript so that Vitest/OXC can parse and run all tests without a `Expected } but found EOF` parse error.

#### Scenario: All auth unit tests run without parse error
- **WHEN** `npm test` is executed in `src/back/`
- **THEN** `auth.service.spec.ts` is loaded and all its tests execute (pass or fail) without a transform/parse error

#### Scenario: No previously-passing auth test regresses
- **WHEN** the structural fix is applied
- **THEN** every test that was passing before the fix continues to pass

#### Scenario: Testability — run auth tests in isolation
- **WHEN** `npx vitest run src/auth/auth.service.spec.ts` is executed
- **THEN** the command exits with code 0 and reports 0 failed tests
