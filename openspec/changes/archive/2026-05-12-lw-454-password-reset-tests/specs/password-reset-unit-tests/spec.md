## ADDED Requirements

### Requirement: AuthService.forgotPassword unit tests

The unit test suite for `AuthService.forgotPassword` SHALL cover all normative scenarios defined in `openspec/specs/password-reset/spec.md` using Vitest + NestJS `TestingModule`. The `PrismaService`, `MailService`, and `ConfigService` MUST be injected as mocks. No real DB or SMTP connection SHALL be made.

#### Scenario: Known email — token created and mail sent

- **GIVEN** `prismaMock.user.findUnique` returns a user with `id: 1, email: 'user@example.com'`
- **AND** `prismaMock.passwordResetToken.updateMany` resolves (marks old tokens used)
- **AND** `prismaMock.passwordResetToken.create` resolves
- **WHEN** `service.forgotPassword({ email: 'user@example.com' })` is called
- **THEN** `prismaMock.passwordResetToken.updateMany` is called once with `{ where: { userId: 1, used: false }, data: { used: true } }`
- **AND** `prismaMock.passwordResetToken.create` is called once with a `data` object containing `userId: 1`, a `token` string (64-char hex SHA-256), and an `expiresAt` Date approximately 30 minutes in the future
- **AND** `mailMock.sendPasswordReset` is called once with `'user@example.com'` and a URL containing `/reset-password?token=`

#### Scenario: Unknown email — NotFoundException thrown

- **GIVEN** `prismaMock.user.findUnique` returns `null`
- **WHEN** `service.forgotPassword({ email: 'unknown@example.com' })` is called
- **THEN** the promise rejects with `NotFoundException`
- **AND** `prismaMock.passwordResetToken.create` is NOT called
- **AND** `mailMock.sendPasswordReset` is NOT called

#### Scenario: Existing unused token invalidated before creating a new one

- **GIVEN** a user has an existing unused token in the DB
- **WHEN** `service.forgotPassword` is called for that user
- **THEN** `prismaMock.passwordResetToken.updateMany` is called BEFORE `prismaMock.passwordResetToken.create`

#### Scenario: Token expiry uses RESET_TOKEN_EXPIRY_MINUTES config value

- **GIVEN** `ConfigService.get('RESET_TOKEN_EXPIRY_MINUTES')` returns `'60'`
- **WHEN** `service.forgotPassword` is called with a known email
- **THEN** the `expiresAt` passed to `passwordResetToken.create` is approximately 60 minutes from `Date.now()`

#### Scenario: Testability — MailService injected as mock

- **GIVEN** the `TestingModule` uses `overrideProvider(MailService).useValue({ sendPasswordReset: vi.fn() })`
- **WHEN** `service.forgotPassword` completes
- **THEN** no real SMTP connection is attempted and the test passes

---

### Requirement: AuthService.resetPassword unit tests

The unit test suite for `AuthService.resetPassword` SHALL verify token validation, password update, and token consumption using Vitest + mocked Prisma. Time-sensitive assertions MUST use `vi.useFakeTimers()` / `vi.setSystemTime()`.

#### Scenario: Valid token — password updated and token marked used

- **GIVEN** `prismaMock.passwordResetToken.findFirst` returns `{ id: 10, userId: 1, used: false, expiresAt: <future date> }`
- **AND** `prismaMock.user.update` resolves
- **AND** `prismaMock.passwordResetToken.update` resolves
- **WHEN** `service.resetPassword({ token: '<raw>', password: 'NewPass123!' })` is called
- **THEN** `prismaMock.user.update` is called with `{ where: { id: 1 }, data: { passwordHash: expect.any(String) } }`
- **AND** `prismaMock.passwordResetToken.update` is called with `{ where: { id: 10 }, data: { used: true } }`

#### Scenario: Token not found — BadRequestException thrown

- **GIVEN** `prismaMock.passwordResetToken.findFirst` returns `null`
- **WHEN** `service.resetPassword({ token: 'invalid', password: 'NewPass123!' })` is called
- **THEN** the promise rejects with `BadRequestException` and message `'Invalid or expired token'`
- **AND** `prismaMock.user.update` is NOT called

#### Scenario: Expired token — BadRequestException thrown

- **GIVEN** `vi.setSystemTime` is used to set current time past the token's `expiresAt`
- **AND** `prismaMock.passwordResetToken.findFirst` returns `null` (Prisma filter on `expiresAt: { gt: new Date() }` returns nothing)
- **WHEN** `service.resetPassword` is called
- **THEN** the promise rejects with `BadRequestException` and message `'Invalid or expired token'`

#### Scenario: Already-used token — BadRequestException thrown

- **GIVEN** the DB has a token with `used: true`
- **AND** `prismaMock.passwordResetToken.findFirst` returns `null` (Prisma filter on `used: false` excludes it)
- **WHEN** `service.resetPassword` is called with the matching raw token
- **THEN** the promise rejects with `BadRequestException` and message `'Invalid or expired token'`

#### Scenario: Token stored as SHA-256 hash of the raw value

- **GIVEN** `prismaMock.passwordResetToken.findFirst` is set up to capture the `where` argument
- **WHEN** `service.resetPassword({ token: 'abc123', password: 'NewPass123!' })` is called
- **THEN** the `where.token` passed to `findFirst` equals `sha256('abc123')` (64-char hex)

#### Scenario: Password updated with bcrypt 10 rounds

- **GIVEN** a valid token record is returned by `findFirst`
- **WHEN** `service.resetPassword` completes successfully
- **THEN** `prismaMock.user.update` is called with `data.passwordHash` that is a valid bcrypt hash (starts with `$2b$10$`)
