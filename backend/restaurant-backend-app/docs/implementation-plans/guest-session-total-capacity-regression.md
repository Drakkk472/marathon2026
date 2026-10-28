# Guest-session total-capacity validation

## Requirement
Fix the invite-link regression where a reservation with capacity 2 rejects its first guest because `GuestCount` is total reservation capacity and the counted guest sessions already include the owner.

## Acceptance criteria
- A reservation of capacity 2 permits one guest session when the owner session is already counted.
- At capacity 2, the next guest is rejected once two sessions (owner plus guest) exist.
- A new guest is rejected only when existing joined sessions already meet or exceed total capacity; preserve the one-seat and other full-capacity behavior.
- No AWS deployment or live API mutation.

## Scope and assumptions
Scope is limited to guest-session capacity validation and its service tests. `GuestSessionRepository.CountByGroupReservationId` counts every session in the group, and group creation saves an `IsOwnerSession` record. `Reservation.GuestCount` is total people allowed, including the owner.

## Implementation tasks
1. [x] Inspect capacity fields, owner-session creation, repository count, and existing tests (Orchestrator).
2. [x] Change the guest admission check to reject when existing joined sessions are already at total reservation capacity (Orchestrator).

## Test tasks
1. [x] Add boundary coverage for capacity 2 (one guest allowed, subsequent guest rejected) and preserve full-capacity behavior for other capacities (Restaurant Backend Unit Test Writer).
2. [x] Run `dotnet test .\Tests\APIHandler.Tests.csproj --filter FullyQualifiedName~GuestSessionServiceTests` from the backend app directory (Orchestrator): passed, 40 tests, 0 failures.

## Review tasks
1. [x] Perform read-only review of the completed production and test files and count/owner-session semantics (Restaurant Backend Code Reviewer): no actionable findings. Reviewer could not inspect a Git diff because the checkout has no Git metadata.

## Status
Complete. The focused run emitted pre-existing NuGet vulnerability warnings (NU1902) for referenced packages; no deployment or live API mutation was performed.
