# E2E Testing Guide

This guide explains how to work with the Playwright E2E test suite for the LightWeight project.

## Table of Contents

- [Installation and Setup](#installation-and-setup)
- [Running Tests](#running-tests)
- [Test Organization and Conventions](#test-organization-and-conventions)
- [Using Playwright Fixtures](#using-playwright-fixtures)
- [Debugging Tests](#debugging-tests)
- [Playwright Trace Viewer](#playwright-trace-viewer)
- [CI Integration](#ci-integration)

## Installation and Setup

### Prerequisites

- Node.js 20+
- Docker and Docker Compose (for running the full stack locally)
- Git

### Install Dependencies

Navigate to the E2E test directory and install dependencies:

```bash
cd e2e
npm install
npx playwright install chromium
```

### Start the Application Stack

The E2E tests require the full LightWeight application to be running. You have two options:

#### Option 1: Using Docker Compose (Recommended)

1. From the project root, start all services:

   ```bash
   docker compose up -d
   ```

2. Enable E2E testing mode by setting the environment variable:
   ```bash
   # In a new terminal, or add to your docker-compose.yml override
   docker exec -it lw-backend sh -c "export E2E_TESTING=true"
   ```

#### Option 2: Manual Setup

1. Start PostgreSQL database (via Docker or locally)

2. Start the backend with E2E testing enabled:

   ```bash
   cd src/back
   E2E_TESTING=true npm run start:dev
   ```

3. In another terminal, start the frontend:
   ```bash
   cd src/front
   npm run dev
   ```

### Database Setup

Run the database migrations and seed the test data:

```bash
cd src/back
npx prisma migrate deploy
npx prisma db seed
```

The seed creates test users and initial data required for the E2E tests.

### Verify Setup

Ensure both services are running:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

You can verify the backend E2E endpoints are available:

```bash
curl http://localhost:3000/testing/reset
```

## Running Tests

### Basic Commands

From the `e2e/` directory, use these npm scripts:

```bash
# Run all E2E tests
npm run test:e2e:browser

# Run tests with Playwright UI for debugging
npm run test:e2e:browser:ui

# Run tests in debug mode (step through interactively)
npm run test:e2e:browser:debug
```

### Running Specific Tests

You can run individual test files or use Playwright's filtering options:

```bash
# Run a specific test file
npx playwright test tests/auth.spec.ts

# Run tests matching a pattern
npx playwright test --grep "login"

# Run tests with a specific tag
npx playwright test --grep "@smoke"

# Run tests in a specific project (defined in playwright.config.ts)
npx playwright test --project chromium
```

### Execution Options

The test suite is configured with these defaults:

- **Workers**: 1 (sequential execution to avoid database conflicts)
- **Timeout**: 30 seconds per test
- **Retries**: 2 in CI, 0 locally
- **Browser**: Chromium (Desktop Chrome)
- **Base URL**: http://localhost:5173 (configurable via PLAYWRIGHT_BASE_URL)

### Test Output

- **Console**: Test results are displayed in the terminal
- **Screenshots**: Captured on failure (saved to `test-results/`)
- **Videos**: Recorded on failure (saved to `test-results/`)
- **Traces**: Generated on first retry (for debugging)

### Parallel Execution Warning

⚠️ **Important**: Tests run with `workers: 1` because they share the same database. Parallel execution would cause race conditions during database resets. If you need to run tests in parallel, ensure each worker uses a separate database instance.

## Test Organization and Conventions

### File Structure

```
e2e/
├── tests/                    # Test files
│   ├── auth.spec.ts         # Authentication tests
│   ├── routines.spec.ts     # Routine management tests
│   ├── coop-session.spec.ts # Cooperative session tests
│   └── ...
├── fixtures/                # Test fixtures and utilities
│   ├── index.ts            # Main fixture definitions
│   ├── auth.ts             # Authentication helpers
│   ├── users.ts            # Test user definitions
│   ├── two-contexts.ts     # Multi-user context setup
│   ├── pages/              # Page Object Models
│   │   ├── LoginPage.ts
│   │   └── RegisterPage.ts
│   └── reset.ts            # Database reset utilities
├── playwright.config.ts     # Playwright configuration
└── package.json            # Test dependencies and scripts
```

### Naming Conventions

- **Test files**: Use `.spec.ts` extension and descriptive names (e.g., `auth.spec.ts`, `invitations.spec.ts`)
- **Test cases**: Use descriptive names that explain the scenario being tested
- **Page Objects**: Named after the page/component they represent (e.g., `LoginPage`, `RegisterPage`)
- **Fixtures**: Use camelCase for fixture names (e.g., `loginAs`, `twoContexts`)

### Test Data Conventions

- **User prefix**: All test data uses the `e2e_` prefix to distinguish from production data
- **Database cleanup**: The `freshDb` fixture automatically resets the database before each test
- **Idempotent operations**: Database seed is idempotent and can be run multiple times

### Test Categories

The test suite covers these main areas:

- **Authentication**: Login, registration, logout, session persistence
- **Routines**: Creating, editing, and assigning exercise routines
- **Invitations**: Coach-client linking via codes or usernames
- **Cooperative Sessions**: Real-time workout sessions between coach and client
- **Smoke Tests**: Basic functionality verification

### Page Objects

Use Page Object Models for better maintainability:

```typescript
// Example usage in a test
test("user can log in", async ({ loginPage, page }) => {
  await loginPage.goto();
  await loginPage.fillCredentials("user@example.com", "password");
  await loginPage.submit();
  await expect(page).toHaveURL(/\/dashboard/);
});
```

Page Objects encapsulate selectors and actions, making tests more readable and easier to maintain when UI changes.

## Using Playwright Fixtures

The test suite uses custom Playwright fixtures to simplify test setup and provide common functionality.

### Available Fixtures

#### `freshDb`

Automatically resets the database before each test to ensure clean state.

```typescript
test("creates a new routine", async ({ freshDb, loginAs }) => {
  // Database is automatically reset here
  const page = await loginAs("coach");
  // Test continues with clean database state
});
```

#### `loginAs`

Logs in as a specific user role and returns an authenticated page.

```typescript
test("coach views dashboard", async ({ loginAs }) => {
  const page = await loginAs("coach"); // Roles: 'coach', 'clientLinked', 'clientUnlinked'
  await page.goto("/dashboard");
  await expect(page.locator("h1")).toContainText("Dashboard");
});
```

Available roles:

- `'coach'`: e2e_coach user
- `'clientLinked'`: e2e_client_linked (assigned to coach)
- `'clientUnlinked'`: e2e_client_unlinked (no coach assignment)

#### `loginPage` and `registerPage`

Page Object instances for authentication pages.

```typescript
test("successful login", async ({ loginPage, page }) => {
  await loginPage.goto();
  await loginPage.fillCredentials("e2e_coach", "E2eP@ss123!");
  await loginPage.submit();
  await expect(page).toHaveURL(/\/dashboard/);
});
```

#### `twoContexts` (Multi-User Testing)

Creates two separate browser contexts for testing interactions between coach and client.

```typescript
test("coach and client interact in session", async ({ twoContexts }) => {
  const { coachPage, clientPage } = twoContexts;

  // Coach creates a session
  await coachPage.goto("/sessions");
  await coachPage.click("text=Create Session");
  const sessionCode = await coachPage.locator(".session-code").textContent();

  // Client joins the session
  await clientPage.goto("/join");
  await clientPage.fill('input[name="code"]', sessionCode);
  await clientPage.click("text=Join");

  // Both users are now in the same session
  await expect(coachPage.locator(".participant")).toContainText(
    "e2e_client_linked",
  );
  await expect(clientPage.locator(".coach-name")).toContainText("e2e_coach");
});
```

The `twoContexts` fixture provides:

- `coachContext` and `coachPage`: Coach's browser context and page
- `clientContext` and `clientPage`: Client's browser context and page

Both contexts are automatically authenticated and cleaned up after the test.

### Test Data

The fixtures use these predefined test users:

| Username              | Role   | Coach Assignment | Password      |
| --------------------- | ------ | ---------------- | ------------- |
| `e2e_coach`           | COACH  | —                | `E2eP@ss123!` |
| `e2e_client_linked`   | CLIENT | `e2e_coach.id`   | `E2eP@ss123!` |
| `e2e_client_unlinked` | CLIENT | `null`           | `E2eP@ss123!` |

### Custom Fixtures

To create custom fixtures, extend the test function in `fixtures/index.ts`:

```typescript
interface CustomFixtures {
  myCustomFixture: string;
}

export const test = base.extend<CustomFixtures>({
  myCustomFixture: async ({}, use) => {
    // Setup
    await use("custom value");
    // Cleanup
  },
});
```

### Disabling Auto-Fixtures

To disable the automatic database reset for a specific test:

```typescript
test.use({ freshDb: false });
```

This is useful when you want to test state persistence across multiple operations.

## Debugging Tests

### Local Debugging

#### Headed Mode

Run tests with a visible browser window to see what's happening:

```bash
# Using npm script
npm run test:e2e:browser:ui

# Or directly with Playwright
npx playwright test --headed
```

#### Debug Mode

Step through tests interactively:

```bash
# Using npm script
npm run test:e2e:browser:debug

# Or directly
npx playwright test --debug
```

In debug mode, you can:

- Set breakpoints in test code
- Step through execution
- Inspect page state
- Use `page.pause()` to stop execution at specific points

#### Adding Debug Statements

```typescript
test("debug example", async ({ page }) => {
  console.log("Starting test...");
  await page.goto("/");
  console.log("Page loaded:", page.url());

  // Pause execution for manual inspection
  await page.pause();

  // Add breakpoints in your IDE
  debugger; // Will trigger if running with --debug

  await page.click("button");
});
```

#### Inspecting Elements

Use Playwright's codegen to see how to interact with elements:

```bash
npx playwright codegen http://localhost:5173
```

This opens a browser where you can click elements and see the generated code.

### Failure Analysis

#### Automatic Artifacts

On test failure, Playwright automatically captures:

- **Screenshots**: Visual snapshot of the page at failure
- **Videos**: Full recording of the test execution
- **Traces**: Detailed execution timeline (on first retry)

Artifacts are saved to `e2e/test-results/`.

#### Viewing Traces

Use the Playwright Trace Viewer to analyze failures:

```bash
npx playwright show-trace e2e/test-results/some-trace.zip
```

The trace viewer shows:

- Network requests
- Console logs
- Screenshots at each step
- Action timeline

### CI Debugging

#### GitHub Actions Artifacts

When tests fail in CI, artifacts are automatically uploaded:

- Navigate to the failed workflow run
- Download the `e2e-report-{run_id}` artifact
- Extract and examine the contents

#### Common CI Issues

1. **Timeout Issues**: Tests may run slower in CI due to resource constraints
   - Increase timeout in `playwright.config.ts`
   - Check for race conditions in your test

2. **Flaky Tests**: Tests that pass locally but fail in CI
   - Use retries (already configured: 2 in CI)
   - Add wait conditions instead of fixed delays
   - Check for timing-dependent assertions

3. **Environment Differences**
   - Ensure CI uses the same Node.js version
   - Verify environment variables are set correctly
   - Check that services are fully ready before tests start

#### Debugging CI Locally

Replicate CI conditions locally:

```bash
# Run with same configuration as CI
PLAYWRIGHT_BASE_URL=http://localhost:5173 npx playwright test --retries=2

# Run in headless mode (like CI)
npx playwright test --headed=false
```

### Troubleshooting Tips

- **Test Isolation**: Ensure tests don't depend on each other
- **Database State**: Use `freshDb` fixture to ensure clean state
- **Async Operations**: Wait for elements/network requests to complete
- **Selectors**: Use robust selectors (data-testid, ARIA attributes)
- **Race Conditions**: Add explicit waits for dynamic content

```typescript
// Instead of this (brittle):
await page.click("button");

// Use this (robust):
await page.locator("button").waitFor();
await page.click("button");
await page.waitForURL("**/expected-page");
```

## Playwright Trace Viewer

The Playwright Trace Viewer is a powerful tool for analyzing test execution and debugging failures.

### Generating Traces

Traces are automatically generated when tests fail (configured as `trace: "on-first-retry"`):

```bash
# Manually generate traces for all tests
npx playwright test --trace on

# Generate traces only on failure
npx playwright test --trace retain-on-failure
```

### Viewing Traces

Open traces in the Trace Viewer:

```bash
# View a specific trace file
npx playwright show-trace e2e/test-results/some-test-trace.zip

# View the most recent trace
npx playwright show-trace e2e/test-results/
```

### What Traces Show

The Trace Viewer provides:

- **Timeline**: Step-by-step execution with timestamps
- **Screenshots**: Visual state at each action
- **Network**: HTTP requests and responses
- **Console Logs**: Browser console output
- **Source Code**: Test code with execution highlighting
- **Action Details**: Click coordinates, text input, etc.

### Using Traces for Debugging

1. **Identify Failure Point**: See exactly where the test failed
2. **Check Element State**: Verify elements were visible/interactable
3. **Network Issues**: Check if API calls failed or returned unexpected data
4. **Timing Problems**: See if actions happened in the wrong order
5. **Visual Changes**: Compare screenshots before/after actions

### CI Trace Analysis

In CI failures:

1. Download the `e2e-report-{run_id}` artifact
2. Extract the `.zip` trace files
3. Open with `npx playwright show-trace path/to/trace.zip`
4. Analyze the failure without re-running locally

### Best Practices

- **Enable traces in development** for complex test debugging
- **Review traces regularly** to improve test reliability
- **Use traces to document** expected behavior for future maintainers
- **Archive important traces** for regression analysis

## CI Integration

E2E tests run automatically in GitHub Actions on pull requests and can be triggered manually.

### When Tests Run

- **Pull Requests**: Tests run automatically when you create or update a PR
- **Manual Trigger**: Use the "E2E Tests" workflow dispatch from the Actions tab
- **Main Branch**: Tests run on every push to `main` (though usually via PR)

### CI Environment

The CI pipeline:

- Uses **Ubuntu latest** with Node.js 20
- Runs **PostgreSQL 17** as a service container
- Builds both backend and frontend
- Starts services and waits for readiness
- Runs the full test suite with retries enabled
- Uploads failure artifacts (screenshots, videos, traces)

### CI Configuration

Key settings in `.github/workflows/e2e.yml`:

- **Workers**: 1 (sequential execution)
- **Retries**: 2 attempts on failure
- **Timeout**: 30 seconds per test
- **Artifacts**: Retained for 7 days on failure

### Handling CI Failures

#### Accessing Results

1. Go to the PR's "Checks" tab or Actions tab
2. Click on the failed "E2E Tests" job
3. View test output in the logs
4. Download artifacts if available

#### Common CI Issues

1. **Service Startup**: Backend/frontend may take longer to start in CI
   - The workflow waits up to 60 seconds for each service

2. **Resource Constraints**: CI runners have limited CPU/memory
   - Tests may run slower than locally
   - Increase timeouts if needed

3. **Database Differences**: CI uses a fresh PostgreSQL instance
   - Ensure migrations and seeds work correctly
   - Check for hardcoded localhost assumptions

#### Debugging CI Locally

Replicate CI conditions:

```bash
# Run with retries like CI
npx playwright test --retries=2

# Run in headless mode
npx playwright test --headed=false

# Use same base URL
PLAYWRIGHT_BASE_URL=http://localhost:5173 npx playwright test
```

### CI Best Practices

- **Fast Feedback**: Keep tests focused and fast
- **Reliable Tests**: Avoid flaky tests that cause false failures
- **Parallel Safety**: Tests are designed to run sequentially due to shared DB
- **Artifact Usage**: Use traces and videos to debug without re-running

### Manual CI Runs

To run E2E tests manually in CI:

1. Go to GitHub Actions tab
2. Select "E2E Tests (Playwright)" workflow
3. Click "Run workflow"
4. Choose the branch to test</content>
   <parameter name="filePath">C:\Users\Lenovo\Desktop\daw2Amin\ProjecteFinal\prj-final-lightweight-1\docs\e2e.md
