# Group reservation owner double-count

## Requirement
The group-order participant count must not count the owner twice.

## Acceptance criteria
- Status reports the number of stored participant sessions, including the owner's session exactly once.
- A regression test covers an owner session and guest session.
- Existing guest-capacity and status behavior remains unchanged otherwise.

## Scope and assumptions
- The owner is represented by a guest-session record created with the group reservation.
- `Reservation.GuestCount` is the capacity used by the existing guest-session flow.

## Implementation tasks
1. [completed] Orchestrator: remove the extra owner increment from status counting.

## Test tasks
1. [completed] Restaurant Backend Unit Test Writer: add focused coverage for owner and guest session counting, including the empty-session case.

## Review tasks
1. [completed] Restaurant Backend Code Reviewer: reviewed the change; no actionable findings.

## Status
Complete. Validation: `dotnet test backend\restaurant-backend-app\Tests\APIHandler.Tests.csproj --filter "FullyQualifiedName~GuestSessionServiceTests"` passed (43 passed, 0 failed); `git diff --check` passed. Final review found no actionable issues.
