# Specs: ci-unit-tests

## Notes

This change is a CI infrastructure configuration that does not introduce new application capabilities requiring detailed specifications.

The unit test execution is already implemented via:
- Backend: `src/back/vitest.config.ts` configured with `vitest run`
- Frontend: Vite's built-in Vitest integration via `npm run test`
- Test scripts defined in both `package.json` files

This change only adds the GitHub Actions workflow to run these tests automatically on pull requests.

## Referenced Documents

- **proposal.md**: Describes the motivation and scope of this change
- **design.md**: Contains the technical implementation details and decisions

## No Additional Spec Requirements

This is purely an infrastructure change with no new REST APIs, database schemas, Socket.IO events, or user-facing features that require specification.