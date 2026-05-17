## Context

The LightWeight project includes a comprehensive E2E test suite built with Playwright to ensure critical user journeys work correctly. The suite covers authentication flows, routine management, invitations, and cooperative workout sessions. However, there is no centralized documentation explaining how to work with this test suite, leading to inconsistent development practices and difficulties in debugging.

## Goals / Non-Goals

**Goals:**
- Create a comprehensive guide covering all aspects of working with the E2E test suite
- Document installation, execution, and debugging procedures
- Explain Playwright fixtures and patterns used in the project
- Provide guidance for CI integration and local development

**Non-Goals:**
- Modify the existing E2E test suite or its implementation
- Add new tests or change testing frameworks
- Implement automated documentation generation

## Decisions

- **Documentation Location**: Place the guide in `docs/e2e.md` to keep it alongside other project documentation
- **Format**: Use Markdown with clear sections and code examples for easy reference
- **Content Structure**: Organize by workflow (setup → development → debugging → CI) rather than by feature
- **Language**: Write in English to match the codebase, with Spanish/Catalan examples where relevant

## Risks / Trade-offs

- **Maintenance Overhead**: Documentation may become outdated if the test suite evolves significantly
  - *Mitigation*: Include a note about checking the actual test files for the latest patterns
- **Scope Creep**: Trying to document every Playwright feature vs focusing on project-specific usage
  - *Mitigation*: Focus on LightWeight-specific patterns and reference Playwright docs for general features</content>
<parameter name="filePath">C:\Users\Lenovo\Desktop\daw2Amin\ProjecteFinal\prj-final-lightweight-1\openspec\changes\document-e2e-testing-guide\design.md