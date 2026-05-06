## Context

The LightWeight platform currently has no automated E2E tests. The frontend has no test framework configured, and backend Jest coverage is minimal. The team needs a prioritized list of user flows to guide future E2E test implementation. This document provides that guidance.

## Goals / Non-Goals

**Goals:**
- Identify all critical user journeys that require E2E coverage
- Prioritize flows based on business impact and usage frequency
- Provide a reference document for the development team

**Non-Goals:**
- Implement actual E2E tests (this is a planning document)
- Test backend unit logic (backend already has Jest, though minimal)
- Cover edge cases or error paths in detail

## Decisions

### Decision 1: Prioritization Criteria

**Chosen:** Impact × Frequency matrix
- **Impact**: Critical business value (revenue, core feature)
- **Frequency**: How often the flow is used by real users

**Alternative considered:** Risk-based (paths that could fail most) → Rejected because without real usage data, impact is more actionable.

### Decision 2: Flow Coverage Scope

**Chosen:** Focus on happy paths only for initial E2E coverage
- Cover primary user journeys end-to-end
- Error paths verified manually via existing QA checklist

**Alternative:** Full coverage including error states → Rejected to keep scope manageable for initial phase.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-------------|
| Prioritization may not match actual usage | Review list with product owner; adjust based on analytics if available |
| Flows become outdated as features change | Re-evaluate list quarterly or before new test implementation phases |
| Realtime features are hard to test E2E | Use PlaywrightwaitForFunction or Cypresscy.contains for socket events; acknowledge complexity in test implementation plan |