# Owner Group Pre-order Submission

## Requirement
Implement the owner-only `GET /reservations/{reservationId}/guest-session-id` endpoint and `POST /group-reservations/{groupReservationId}/submit` endpoint. The submit operation consolidates dishes from submitted guest sessions into the reservation order and marks both the order and group reservation submitted.

## Acceptance criteria
- Both endpoints require an authenticated reservation owner; unauthenticated callers receive 401 and other users receive 403.
- The session-id endpoint returns the owner session ID for the reservation and returns 404 when the reservation or required group/session is missing.
- Submit validates the group reservation and request reservation, aggregates only submitted sessions by `dishId`, and returns the aggregated dish/quantity list.
- Submit saves the consolidated dishes with order status `SubmittedByCustomer` and group reservation status `Submitted`.
- Missing reservation or group reservation returns 404; no submitted sessions, no submitted dishes, or no order returns 400.
- Routes, deployment configuration, and API documentation describe the implemented behavior and response shape.

## Scope and assumptions
- Keep changes within `backend/restaurant-backend-app`.
- Identify the reservation owner using the authenticated Cognito `sub` claim, consistent with existing owner routes.
- The reservation ID in the submit body must match the group reservation's associated reservation.
- Preserve existing order persistence and status conventions; treat the consolidated submitted-session quantities as the final order dish list.

## Implementation tasks
1. Restaurant Lambda Implementer: add owner session lookup and group pre-order submission services, handlers, route/deployment wiring, and API documentation. **Done**
2. Restaurant Lambda Implementer: reject submit for closed/already-submitted groups and reservations outside the eligible state before modifying order data. **Done** — maps lifecycle rejection to 409 before order mutation.

## Test tasks
1. Restaurant Backend Unit Test Writer: cover authorization, missing entities, empty submitted sessions/dishes, aggregation, saved order/group statuses, and response serialization. **Done** — 28 focused tests passed.
2. Restaurant Backend Unit Test Writer: add focused regression coverage for ineligible group/reservation lifecycle states. **Done** — closed/submitted groups and non-reserved reservations reject before mutation; handler lifecycle errors map to 409.
3. Orchestrator: rerun the smallest relevant test and build commands and record outcomes. **Done** — focused suite passed 35/35; API handler build passed.

## Review tasks
1. Restaurant Backend Code Reviewer: read-only review of the completed implementation and tests. **Done with one medium finding; fix implemented and regression tests added**
2. Restaurant Backend Code Reviewer: focused read-only follow-up review of the lifecycle guard fix. **Done — prior finding resolved; no remaining actionable findings**

## Status
- Complete — implementation, tests, documentation, validation, and review finished with no remaining actionable findings.
- Validation: `dotnet build dnapp/lambdas/api-handler/APIHandler.csproj --no-restore -v:q` passed after the lifecycle guard (pre-existing dependency vulnerability warnings).
- Validation: `dotnet test Tests/APIHandler.Tests.csproj --no-restore --filter "FullyQualifiedName~OwnerGroupPreOrderServiceTests|FullyQualifiedName~GetOwnerGuestSessionIdHandlerTests|FullyQualifiedName~SubmitGroupPreOrderHandlerTests" -v:minimal` passed after regression tests (35/35; existing dependency vulnerability warnings).
- Validation: `deployment_resources.json` parsed successfully with PowerShell `ConvertFrom-Json`.
- Validation: `deployment_resources.json` parsed successfully with PowerShell `ConvertFrom-Json`.
