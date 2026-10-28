# Implementation Plan: Allow Invite Review at Guest Capacity

## Requirement

Allow owners to open the group pre-order review when a reservation has reached its guest limit. Keep guest session creation capacity enforcement intact.

## Acceptance criteria

- `GET /guest/invites/{token}` returns invite details for an open group reservation even at capacity.
- Creating another guest session while at capacity continues to fail with `GuestLimitExceededException`.
- Relevant backend tests pass.

## Scope and assumptions

- `GroupReservationService.GetGroupReservationByTokenAsync` is a read operation used to display invite details; it must not reserve a seat.
- Guest capacity remains enforced when creating guest sessions in `GuestSessionService`.
- No deployment or live backend mutation is performed.

## Implementation tasks

1. Remove capacity rejection from invite-detail retrieval — **Orchestrator** — done.

## Test tasks

1. Update/add service coverage for invite detail retrieval at capacity — **Restaurant Backend Unit Test Writer** — done.
2. Run focused backend tests — **Orchestrator** — done: filtered `dotnet test` passed 9 tests.

## Review tasks

1. Read-only review of the focused backend change — **Restaurant Backend Code Reviewer** — done; no actionable findings.

## Status

Complete. Root cause was invite-detail retrieval rejecting a full reservation even though guest-session creation separately enforces capacity. Invite retrieval now returns details regardless of current guest count; `GuestSessionService.CreateGuestSessionAsync` retains its existing capacity guard.

Validation: `dotnet test backend\restaurant-backend-app\Tests\APIHandler.Tests.csproj --no-restore --verbosity quiet --filter "FullyQualifiedName~GetGroupReservationByTokenAsync|FullyQualifiedName~CreateGuestSessionAsync_WhenCapacityReached"` — passed, 9 tests. Existing NuGet vulnerability warnings were emitted for ImageSharp and System.Security.Cryptography packages.

Review: **Restaurant Backend Code Reviewer** found no actionable issues. No live backend changes or deployment performed.
