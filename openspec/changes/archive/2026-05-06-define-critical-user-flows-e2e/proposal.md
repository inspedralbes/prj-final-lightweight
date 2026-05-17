## Why

The LightWeight platform lacks a clear strategy for E2E test coverage. With no automated tests configured on the frontend today and minimal backend Jest coverage, the team needs guidance on which user journeys should be prioritized for E2E testing. Without this, regression risks grow as new features are added.

## What Changes

- Create a prioritized list of user flows (user journeys) to be covered by E2E tests
- Document the rationale for prioritization (impact × frequency)
- Provide a reference document that guides the implementation of E2E tests in future work

## Capabilities

### New Capabilities
- `e2e-critical-flows`: Document defining the prioritized list of E2E test user journeys for the LightWeight platform

### Modified Capabilities
- None. This is a planning document; no existing requirement changes.

## Impact

- **Testing**: Defines scope for future E2E test implementation (likely Playwright or Cypress)
- **Documentation**: Creates reference for QA and development teams
- **Process**: Establishes prioritization framework for test coverage decisions