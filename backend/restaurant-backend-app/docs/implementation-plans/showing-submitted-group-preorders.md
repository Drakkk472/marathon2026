# Showing Submitted Group Pre-Orders

## Requirement

Keep the owner’s group pre-order page loadable after submission so it can display the persisted `Submitted` status.

## Acceptance criteria

- The reservation owner can retrieve the group invite details needed to reload the review page after submission.
- A submitted group invite can be resolved for display, while a closed invite remains unavailable.
- Guests still cannot join or modify a submitted group.
- Focused backend tests cover these status behaviors.

## Scope and assumptions

- The group status is already persisted as `Submitted`; the reload failure is caused by invite-token and invite-detail reads rejecting that status.
- Scope is limited to the backend group-reservation invite lookup services and their tests; no deployment or infrastructure changes.

## Implementation tasks

1. Orchestrator: allow owner invite-token retrieval for submitted groups and allow submitted invite details to be read, while retaining closed-state rejection. **Done**

## Test tasks

1. Restaurant Backend Unit Test Writer: cover successful invite-token and invite-detail lookups for submitted groups, continued rejection for closed groups, and blocked guest-session creation/modification after submission. Tests are in `Tests/Services/GroupReservationServiceTests.cs` and `Tests/Services/GuestSessionServiceTests.cs`. **Done**
2. Orchestrator: run focused backend tests with `dotnet test backend/restaurant-backend-app/Tests/APIHandler.Tests.csproj --filter "FullyQualifiedName~GroupReservationServiceTests|FullyQualifiedName~GuestSessionServiceTests" --no-restore`; result: **56 passed, 0 failed, 0 skipped**. Existing NuGet vulnerability warnings were emitted. `git diff --check` passed. **Done**

## Review tasks

1. Restaurant Backend Code Reviewer: read-only review of the production and test changes. **Done — no actionable findings.**

## Status

- Implementation: complete.
- Tests: complete; focused tests passed.
- Review: complete; no actionable findings.
- Final validation: `dotnet test backend/restaurant-backend-app/Tests/APIHandler.Tests.csproj --filter "FullyQualifiedName~GroupReservationServiceTests|FullyQualifiedName~GuestSessionServiceTests" --no-restore` passed (56 tests); `git diff --check` passed.
- Remaining: changes must be deployed through the normal release process before they take effect in the live API. No deployment was performed.
