## 1. Fix auth.service.spec.ts — parse error

- [x] 1.1 Read the full `src/back/src/auth/auth.service.spec.ts` file and locate the unbalanced `describe(` or `it(` block that causes the `Expected } but found EOF` parse error
- [x] 1.2 Close the unclosed block with the missing `});` at the correct indentation level
- [x] 1.3 Run `npx vitest run src/auth/auth.service.spec.ts` and confirm 0 parse errors and 0 failed tests

## 2. Fix invitations.service.spec.ts — wrong exception type

- [x] 2.1 In `src/back/src/invitations/invitations.service.spec.ts`, replace the `BadRequestException` import reference used in the "client already has a coach" test with `ConflictException` (imported from `@nestjs/common`)
- [x] 2.2 Update the `rejects.toThrow(BadRequestException)` assertion on line ~108 to `rejects.toThrow(ConflictException)`
- [x] 2.3 Run `npx vitest run src/invitations/invitations.service.spec.ts` and confirm 0 failed tests

## 3. Fix testing.service.spec.ts — incomplete Prisma mock

- [x] 3.1 In `src/back/src/testing/testing.service.spec.ts`, add `liveSession: { deleteMany: ReturnType<typeof vi.fn> }` to the `PrismaMock` interface
- [x] 3.2 In `buildPrismaMock()`, add `liveSession: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) }` to the returned object
- [x] 3.3 Run `npx vitest run src/testing/testing.service.spec.ts` and confirm 0 failed tests

## 4. Verification

- [x] 4.1 Run full backend test suite: `cd src/back && npm test` — confirm output shows `0 failed` out of 40 tests
- [x] 4.2 Run `cd src/back && npm run build` — confirm NestJS compiles with no errors
- [ ] 4.3 Commit: `fix(tests): resolve 3 failing unit tests before prod merge`
