# Owner Order and Group Submit Semantics

## Requirement
Determine whether `POST /group-reservations/{groupReservationId}/submit` must include the Owner's normal reservation pre-order, and whether the current behavior matches the backend contract.

## Acceptance criteria
- Trace the submit implementation, Owner-session lifecycle, normal order flow, and `homework-backend.md` contract.
- Distinguish the explicitly specified source dishes from how they are written to the existing order.
- Avoid changing behavior until overlapping Owner-session and reservation-order dish semantics are explicit.
- Identify the concrete missing integration if Owner's normal order must be included.

## Scope and assumptions
- Keep the investigation within `backend/restaurant-backend-app`; read the root `homework-backend.md` as the stated contract.
- Do not deploy or mutate AWS resources.
- The submitted guest-session quantities are the canonical group-submit input unless the contract states otherwise.

## Implementation tasks
1. Orchestrator: trace group submit, Owner-session creation, normal reservation-order editing, and API contract. **Done** — contract names submitted guest sessions as the input, but does not state whether those dishes replace or merge with pre-existing order dishes; no backend change is safe without clarifying the Owner-order source and overlap semantics.

## Test tasks
1. Restaurant Backend Unit Test Writer: no test change requested because production behavior remains unchanged. **Not applicable**
2. Orchestrator: run a focused test/build only if production or test code changes. **Not applicable** — no source change.

## Review tasks
1. Restaurant Backend Code Reviewer: read-only review of the investigation conclusion and plan. **Done with two medium findings; plan clarified below**
2. Restaurant Backend Code Reviewer: focused follow-up review of the clarified contract/integration distinction. **Done — no remaining actionable findings**

## Status
- Current behavior: `SubmitGroupPreOrderAsync` aggregates only submitted sessions, then replaces `order.Dishes` with that aggregate. Existing service tests assert this replacement (the original order dish is discarded). The contract names submitted sessions as the source and says to add the aggregate to the order, but does not explicitly say whether to preserve/merge the pre-existing order dishes.
- No production fix made: automatically adding normal-order dishes would introduce an undocumented second input source and could double-count overlap with submitted Owner-session dishes. The backend contract must first define whether the normal order is excluded, merged, or authoritative.
- Required integration if Owner's normal-order dishes are intended group input: provide an Owner-authorized path that copies/maintains those dishes in the Owner guest session and submits that session before group submit, or revise the group-submit contract/backend to merge the normal order and guest sessions with explicit precedence/deduplication. Today Owner-session creation initializes an empty session without a session token; the Owner-session-ID endpoint returns only the ID, while guest dish-edit and cart-submit endpoints require a valid guest-session bearer token. Normal pre-order editing writes to the reservation order and does not synchronize the Owner session.
- Double-counting rule for any future implementation: choose one canonical Owner-dish source or define an explicit reconciliation rule; do not blindly sum both the reservation order and an Owner session that may contain the same selections.
- Review outcome: first read-only review found two documentation precision issues; addressed above. Focused follow-up review found no remaining actionable findings.
- Validation: no build or tests run because no backend code or tests changed.
