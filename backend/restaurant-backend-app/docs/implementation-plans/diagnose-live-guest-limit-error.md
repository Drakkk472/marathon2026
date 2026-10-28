# Implementation Plan: Diagnose Live Guest-Limit Error

## Requirement

Trace the live `View Reservation` error (“Guest limit exceeded for this reservation.”) through the backend API route, handler, service, and tests; determine whether local source resolves it or another endpoint/build divergence remains. Do not deploy or make live requests.

## Acceptance criteria

- Identify the exact route and production exception path that can return the quoted error.
- Verify `GET /guest/invites/{token}` and relevant guest-session behavior against current backend source and tests.
- Check available local build artifacts for evidence of whether they contain the source fix; do not infer live deployment state from local artifacts alone.
- Make a scoped source change only if another local code path is defective; do not deploy.
- Record exact validation commands/results, review outcome, and remaining live-state uncertainty.

## Scope and assumptions

- Scope is `backend/restaurant-backend-app`.
- The prior plan records removal of capacity rejection from invite-detail retrieval; this task independently verifies the current route and source.
- No live API requests, mutations, AWS resource changes, or deployment are authorized.
- Local bundle metadata may establish what was built locally, but cannot prove what is currently deployed.

## Findings

- The intended route is `GET /guest/invites/{token}`. It is registered in `Routing/RouteRegistry.cs` to `GetGroupReservationHandler`, which calls `IGroupReservationService.GetGroupReservationByTokenAsync(token)`. The root `deployment_resources.json` maps this route to `api-handler` with authorization `NONE`.
- Current `GroupReservationService.GetGroupReservationByTokenAsync` checks that the group is open and loads reservation, table, location, and inviter details. It does not count guest sessions or throw `GuestLimitExceededException`. The existing capacity-named service test expects invite details to be returned, but does not configure a guest-session count, so its name does not establish a true at-capacity test case.
- The exact text `"Guest limit exceeded for this reservation."` is the optional default message declared in `GuestLimitExceededException`, but there is no current source call that constructs this exception without a message. The invite-detail handler would map a `ValidationException` to a 400 response, but its service path has no capacity rejection to trigger it.
- The separate capacity enforcement is `POST /guest/sessions` → `CreateGuestSessionHandler` → `GuestSessionService.CreateGuestSessionAsync`. It remains in place and throws `GuestLimitExceededException` with a different, detailed message (`"Guest limit exceeded. Maximum capacity is ..., but ... guests have already joined."`); the handler returns a 400 error-code response.
- Local Syndicate bundle directories contain `api-handler-1.0.zip` archives timestamped October 28, 2026 at 20:04:46 and 20:07:23. Attempts to read the archive contents failed with OS error 5 (access denied), so their embedded binaries could not be compared to source. Their timestamps are local build evidence only, not evidence of live deployment state.

## Implementation tasks

1. Trace route → handler → service and check alternate source paths and local bundle evidence — **Restaurant Lambda Implementer** — done.
2. Apply a focused source fix only if a local defect is found — **Orchestrator** — not needed; current source already has the intended fix.

## Test and build tasks

1. Make the invite-details test represent a genuinely full reservation, while preserving the guest-session capacity rejection test — **Restaurant Backend Unit Test Writer** — done.
2. Run the focused invite and capacity tests — **Orchestrator** — done; 9 passed, 0 failed, 0 skipped.
3. Build the affected Lambda — **Restaurant Lambda Implementer** — done; 0 errors.

## Review tasks

1. Read-only review of the final code/test/diagnosis changes — **Restaurant Backend Code Reviewer** — done; no actionable findings. Reviewer did not rerun tests/build and could not inspect Git diff/status because Git metadata was unavailable.

## Validation

- `dotnet test backend\restaurant-backend-app\Tests\APIHandler.Tests.csproj --no-restore --verbosity quiet --filter "FullyQualifiedName~GetGroupReservationByTokenAsync|FullyQualifiedName~CreateGuestSessionAsync_WhenCapacityReached" -p:NuGetAudit=false` — passed, 9 tests; 0 failed, 0 skipped. The invite test now configures the guest-session count to equal the reservation's capacity and asserts invite details are still returned.
- `dotnet build backend\restaurant-backend-app\dnapp\lambdas\api-handler\APIHandler.csproj --no-restore --verbosity quiet` — succeeded, 0 errors (reported by Restaurant Lambda Implementer). Existing NuGet vulnerability warnings were reported for ImageSharp and cryptography packages.
- A first test invocation with `--no-restore` did not run because the Lambda project's `obj/project.assets.json` was absent. The subsequent restore-enabled test command above completed successfully.

## Status

Complete. No production code or deployment configuration changed; the at-capacity invite-detail test was strengthened. Review found no actionable issues. No live API/AWS calls or deployment were performed. Local source confirms the intended invite-detail capacity fix, but inaccessible bundle contents and the lack of live access leave the deployed Lambda version unverified. Live behavior cannot be confirmed or changed by this work; if the deployed Lambda still contains the prior implementation, it will continue to return the error until deployment.
