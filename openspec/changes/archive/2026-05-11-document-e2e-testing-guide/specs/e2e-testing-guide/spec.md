## ADDED Requirements

### Requirement: E2E Testing Guide Installation Section
The documentation SHALL provide clear instructions for installing and setting up the E2E testing environment locally.

#### Scenario: Developer installs dependencies
- **WHEN** a developer follows the installation instructions
- **THEN** all required dependencies for running E2E tests are installed
- **AND** the test suite can be executed without missing package errors

#### Scenario: Docker environment setup
- **WHEN** a developer runs the Docker Compose setup
- **THEN** all services (backend, frontend, database) are available for testing
- **AND** the application is accessible at the expected ports

### Requirement: E2E Testing Guide Execution Section
The documentation SHALL explain how to run E2E tests in different modes (headed, headless, specific tests).

#### Scenario: Running all tests
- **WHEN** a developer executes the full test suite
- **THEN** all E2E tests run sequentially
- **AND** results are reported with pass/fail status

#### Scenario: Running specific test file
- **WHEN** a developer runs a single test file
- **THEN** only that test file executes
- **AND** results are isolated to that test

#### Scenario: Headed mode execution
- **WHEN** a developer runs tests in headed mode
- **THEN** browser windows open and show test execution visually
- **AND** debugging is possible through visual inspection

### Requirement: E2E Testing Guide Conventions Section
The documentation SHALL document naming conventions and organizational patterns for E2E tests.

#### Scenario: Test file naming
- **WHEN** a developer creates a new test file
- **THEN** the file follows the established naming pattern (*.spec.ts)
- **AND** the file is placed in the appropriate directory structure

#### Scenario: Test organization
- **WHEN** a developer organizes test code
- **THEN** tests are grouped by feature or user journey
- **AND** fixtures are reused appropriately

### Requirement: E2E Testing Guide Fixtures Documentation
The documentation SHALL explain how to use Playwright fixtures, including the twoUsers pattern for multi-user flows.

#### Scenario: Using auth fixture
- **WHEN** a developer needs authenticated test context
- **THEN** the auth fixture provides a logged-in user session
- **AND** JWT tokens are handled automatically

#### Scenario: Using twoUsers fixture
- **WHEN** a developer needs to test interactions between two users
- **THEN** the twoUsers fixture provides two separate authenticated contexts
- **AND** both users can interact with the application simultaneously

### Requirement: E2E Testing Guide Debugging Section
The documentation SHALL provide techniques for debugging E2E test failures locally and in CI.

#### Scenario: Local debugging with headed mode
- **WHEN** a test fails locally
- **THEN** headed mode allows visual inspection of the failure
- **AND** breakpoints can be added for step-through debugging

#### Scenario: Using Playwright Trace Viewer
- **WHEN** a test fails
- **THEN** trace files can be generated and viewed
- **AND** the timeline shows exactly what happened during execution

#### Scenario: CI debugging
- **WHEN** a test fails in CI
- **THEN** trace files and screenshots are available for download
- **AND** failure analysis can be performed post-execution

### Requirement: E2E Testing Guide CI Integration
The documentation SHALL explain how E2E tests run in the CI pipeline and how to handle CI-specific issues.

#### Scenario: CI test execution
- **WHEN** code is pushed to main branch
- **THEN** E2E tests run automatically in the CI pipeline
- **AND** failures block the deployment

#### Scenario: CI artifact collection
- **WHEN** tests fail in CI
- **THEN** screenshots, videos, and traces are collected as artifacts
- **AND** they are available for download and analysis

### Requirement: Documentation Accessibility
The E2E testing guide SHALL be easily discoverable and readable by the development team.

#### Scenario: Documentation location
- **WHEN** a developer looks for E2E testing information
- **THEN** the guide is available in docs/e2e.md
- **AND** it is linked from the main README if appropriate

#### Scenario: Documentation completeness
- **WHEN** a developer reads the guide
- **THEN** all required sections are present and up-to-date
- **AND** examples are accurate and functional</content>
<parameter name="filePath">C:\Users\Lenovo\Desktop\daw2Amin\ProjecteFinal\prj-final-lightweight-1\openspec\changes\document-e2e-testing-guide\specs\e2e-testing-guide\spec.md