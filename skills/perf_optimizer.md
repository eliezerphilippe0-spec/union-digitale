# Skill: perf_optimizer

## Scope
Appliqué à :
- Firestore queries
- SQL queries
- pagination
- indexes
- admin dashboards
- N+1 detection

---

## Mandatory Invariants
1. No unbounded queries.
2. All list views must use limit + cursor.
3. No onSnapshot for admin list pages.
4. Avoid N+1 subqueries.
5. Index required for compound queries.

---

## Refusal Rules
- If query lacks limit.
- If no index for where + orderBy.
- If list loads sub-collections per row.
- If admin page uses realtime snapshot.

---

## Implementation Checklist
- [ ] Add pagination
- [ ] Add index if needed
- [ ] Verify no N+1
- [ ] Add fallback UI for index_missing
- [ ] Add rate-limit to analytics events

---

## Tests Required
- Pagination load more test
- Index existence validation
- N+1 detection test

---

## Observability Required
- firestore_index_missing
- slow_query_detected
- pagination_overflow

---

## Examples
Task: Admin Orders page → Must:
- orderBy createdAt
- limit 20
- startAfter
- no subOrders query in list

Task: Buyer orders list → Must:
- where buyerId
- orderBy createdAt
- limit
- no per-order subqueries
