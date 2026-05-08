## Why

Currently, the project lacks automated unit test execution in CI. While Vitest is already configured in both backend and frontend, and scripts are defined in package.json, these tests are not being run automatically on pull requests. This means code changes can introduce regressions without being caught early in the development process.

The LW-436 epic aims to establish a testing strategy (E2E + unit tests). This task (LW-452) specifically implements the CI integration for unit tests, providing fast feedback on code changes before they reach the main branch.

## What Changes

- Create new GitHub Actions workflow `.github/workflows/unit-tests.yml` that runs Vitest tests for both backend and frontend on pull requests
- Configure independent jobs for backend and frontend to allow parallel execution and isolated failure reporting
- Implement node_modules caching to speed up workflow execution
- Configure workflow to fail if any unit test fails, blocking merge when the check fails

## Capabilities

### New Capabilities
- `ci-unit-tests`: Automated unit test execution in CI pipeline via Vitest

### Modified Capabilities
- `infra-deploy`: Extends existing CI/CD infrastructure to include unit test validation

## Impact

- **Backend modules affected**: N/A (no code changes, only CI configuration)
- **Frontend features affected**: N/A (no code changes, only CI configuration)
- **Testing**: Adds automated unit test execution to the existing testing setup
- **Infrastructure**: New GitHub Actions workflow file in `.github/workflows/`

## Non-Goals

- This does NOT include E2E test integration (that's a separate task under LW-436)
- This does NOT add new unit tests - only configures the CI pipeline to run existing tests
- This does NOT modify the existing deployment workflow