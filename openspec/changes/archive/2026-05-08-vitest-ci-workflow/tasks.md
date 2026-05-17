# Tasks: vitest-ci-workflow

## 1. Create Unit Tests CI Workflow

- [x] 1.1 Create `.github/workflows/unit-tests.yml` workflow file
- [x] 1.2 Configure workflow triggers (pull_request to main, workflow_dispatch)
- [x] 1.3 Add backend job with npm ci, cache, and test execution
- [x] 1.4 Add frontend job with npm ci, cache, and test execution
- [x] 1.5 Verify both jobs run in parallel
- [x] 1.6 Verify workflow fails when tests fail

## 2. Verification

- [ ] 2.1 Trigger workflow manually via workflow_dispatch
- [ ] 2.2 Confirm backend tests run successfully
- [ ] 2.3 Confirm frontend tests run successfully
- [ ] 2.4 Verify test results appear as Check Run on PR
- [ ] 2.5 Document recommended branch protection configuration

## 3. Tests / Verification

- [ ] 3.1 Verify workflow executes `npm run test` in backend
- [ ] 3.2 Verify workflow executes `npm run test` in frontend
- [ ] 3.3 Verify cache is correctly applied for both packages
- [ ] 3.4 Verify workflow failure on test failure (manual test with failing test)