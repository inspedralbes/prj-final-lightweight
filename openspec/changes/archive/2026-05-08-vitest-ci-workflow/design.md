## Context

Currently, the project has Vitest configured and ready in both backend (`src/back/vitest.config.ts`) and frontend (`src/front/vite.config.ts`), with `npm run test` scripts available in both `package.json` files. However, these unit tests are not executed automatically during the development workflow.

The existing CI/CD pipeline (`.github/workflows/deploy.yml` and `.github/workflows/e2e.yml`) lacks automated unit test execution. This means:
- No automated regression detection on pull requests
- Developers cannot verify their changes don't break existing functionality before merging
- The testing strategy outlined in epic LW-436 is incomplete

## Goals / Non-Goals

**Goals:**
- Create a GitHub Actions workflow that runs Vitest unit tests for backend and frontend on every pull request to main
- Provide fast feedback (2-3 minutes expected execution time)
- Block pull request merges when tests fail
- Use node_modules caching to minimize CI execution time
- Show test results as GitHub Check Runs in the pull request

**Non-Goals:**
- Do NOT implement E2E tests (separate task in LW-436)
- Do NOT add new unit tests (only configure CI to run existing tests)
- Do NOT modify the existing deployment workflow
- Do NOT require branch protection rules (document as recommended action)

## Decisions

### 1. Separate workflow vs. combined workflow

**Decision:** Create a separate workflow `unit-tests.yml` instead of combining with E2E workflow.

**Rationale:**
- Faster feedback loop for developers (unit tests run in ~2-3 min vs. ~15 min for E2E)
- Clearer separation of concerns and responsibility
- Independent failure handling (unit test failure doesn't block E2E execution and vice versa)
- Follows existing pattern in the repository (E2E has its own workflow)

### 2. Parallel job execution

**Decision:** Run backend and frontend tests in parallel using separate jobs.

**Rationale:**
- Faster overall execution time (no sequential dependency)
- Independent failure reporting in GitHub UI
- Each job can have its own cache based on its package-lock.json

### 3. Cache strategy

**Decision:** Use GitHub Actions cache for node_modules with key based on `package-lock.json` hash.

**Rationale:**
- Proven pattern already used in `e2e.yml` workflow
- Cache key includes file hash to invalidate when dependencies change
- Restore-keys provide fallback to most recent cache

### 4. Test command selection

**Decision:** Use `npm run test` which runs `vitest run`.

**Rationale:**
- `vitest run` is the recommended non-watch mode for CI
- Already configured in both package.json files
- Produces proper exit codes for CI failure detection

## Implementation Details

### Workflow Structure

```yaml
name: Unit Tests (Vitest)

on:
  pull_request:
    branches: [main]
  workflow_dispatch:

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup-node
      - cache node_modules (back)
      - npm ci --prefix src/back
      - npm run test --prefix src/back

  frontend:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup-node
      - cache node_modules (front)
      - npm ci --prefix src/front
      - npm run test --prefix src/front
```

### Cache Configuration

| Package | Cache Key |
|---------|-----------|
| backend | `back-node-modules-${{ hashFiles('src/back/package-lock.json') }}` |
| frontend | `front-node-modules-${{ hashFiles('src/front/package-lock.json') }}` |

### Expected Behavior

1. On every PR to `main`, both jobs run in parallel
2. If either job's tests fail, the workflow fails
3. GitHub displays the failure as a Check Run on the PR
4. Branch protection can be configured to require this workflow before merging

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| No tests exist yet | Workflow runs but passes trivially | Document that adding tests is a follow-up task |
| First run slow (~5-6 min) | Longer than expected | Subsequent runs use cache; acceptable trade-off |
| Vitest not properly configured in CI environment | Tests may fail to run | Already configured with Node environment |

## Migration Plan

This is a pure CI configuration change with no migration required. The workflow is additive and does not modify existing behavior.

1. Create `.github/workflows/unit-tests.yml` file
2. Test the workflow by creating a test PR or running `workflow_dispatch`
3. (Optional) Configure branch protection rules in GitHub to require this workflow
4. Document in project wiki that developers should run `npm run test` locally before pushing