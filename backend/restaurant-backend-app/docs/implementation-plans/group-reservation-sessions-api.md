# Group Reservation Sessions API

## Requirement
Implement `GET /guest/groups/{groupReservationId}/sessions` so the reservation owner can see every participant's session, dishes, per-participant totals, and the aggregate total.

## Acceptance criteria
- Only the reservation owner can retrieve sessions; unauthenticated callers receive 401 and other users receive 403.
- Return the documented `participants` and `total` shape, including participant type and owner sessions when present.
- Resolve dish names/prices from dish records and calculate totals from quantity and current price.
- Return a clear 404 for an unknown group reservation and document/register the route.

## Scope and assumptions
- Keep the implementation within `backend/restaurant-backend-app`.
- Reuse existing group/session repositories, response models, and owner validation patterns.
- The deployment resource for the route must use the plural `/guest/groups/...` path.

## Implementation tasks
1. Orchestrator: add the owner-authorized service operation, Lambda handler, route registration, deployment configuration, and update API documentation. **Done**

## Test tasks
1. Restaurant Backend Unit Test Writer: cover owner/forbidden/missing group behavior, participant mapping, and total calculations. **Done**
2. Restaurant Backend Unit Test Writer: verify the handler serializes the documented camelCase response shape. **Done**
3. Orchestrator: run the smallest relevant test/build command and record its result. **Done** — targeted service and handler tests: 5/5 passed; API handler build passed.

## Review tasks
1. Restaurant Backend Code Reviewer: review the complete change for correctness and regressions. **Done; identified a response-casing defect, which was fixed**
2. Restaurant Backend Code Reviewer: perform a focused follow-up review of the serialization fix. **Done; no actionable findings**

## Status
- Implementation and tests complete, including a handler serialization regression test.
- `dotnet build ...\APIHandler.csproj --no-restore -v:q` passed after the casing fix; existing project warnings remain.
- `dotnet test ...\APIHandler.Tests.csproj --filter "FullyQualifiedName~GetGroupReservationSessions" --no-restore -v:minimal` passed (5/5).
- `deployment_resources.json` parses successfully and contains the plural route.
- Code review found and resolved the response-casing issue; focused follow-up review found no remaining actionable issues.
