# Owner Group Pre-Order Review Investigation

## Requirement
Determine whether `GET /guest/groups/{groupReservationId}/sessions` returns dishes selected in the Owner guest session, distinguish this response from the reservation's normal order, and avoid changing unrelated capacity behavior.

## Acceptance criteria
- Trace the route through handler, service, repository, entity and response DTO.
- Cross-check the homework requirement, API documentation and current implementation.
- If owner-session dishes are omitted, implement a scoped fix with delegated tests, targeted validation and read-only review; otherwise report the current DTO and frontend integration implications without changing production code.
- Do not deploy or make live API mutations.

## Scope and assumptions
- Scope is backend investigation within `backend/restaurant-backend-app`; no frontend code changes are requested.
- Owner pre-order selections are persisted on the Owner `GuestSession`; the normal reservation order is a separate `Order` record.
- Capacity regression work is unrelated unless the trace shows otherwise.

## Implementation tasks
1. Orchestrator: trace route, owner-session retrieval/mapping, order separation and documentation; determine whether a code fix is needed. **Done — response includes owner session items; no production fix needed.**

## Test tasks
1. Orchestrator: run the existing focused group-session service/handler tests as validation. **Done — `dotnet test .\Tests\APIHandler.Tests.csproj --no-build --no-restore --filter "FullyQualifiedName~GetGroupReservationSessions" -v:q`: 5 passed, 0 failed.**
2. Restaurant Backend Unit Test Writer: add or change tests only if a production fix is needed. **Not applicable — no code change.**

## Review tasks
1. Restaurant Backend Code Reviewer: review a production fix if one is needed. **Not applicable — no code change.**

## Status
Complete. The endpoint queries every guest session in the group and maps each session's `Dishes`, including owner sessions; no production fix was needed. Review was not applicable because no production code changed. An initial `--no-restore` attempt failed because the API handler assets file was absent; the subsequent restoring test run completed successfully, and the focused no-build rerun reported 5 passed, 0 failed. Existing NuGet vulnerability warnings were emitted during restore. The capacity regression remains a separate concern and was not changed. No deployment or live API mutation was performed.
