# Skill: growth_engineer

## Scope
Appliqué à :
- badge
- reviews
- trust
- analytics
- KPI
- conversion
- incentives
- loyalty

---

## Mandatory Invariants
1. Every feature must define KPI.
2. Tracking event required.
3. Event payload minimal.
4. Rate-limit tracking events.
5. Define success threshold.

---

## Refusal Rules
- If feature has no measurable KPI.
- If no tracking event defined.
- If event payload excessive.
- If no Go/No-Go criteria.

---

## Implementation Checklist
- [ ] Define KPI
- [ ] Add tracking event
- [ ] Add rate-limit
- [ ] Add dashboard metric
- [ ] Define threshold

---

## Tests Required
- Event fired test
- Rate-limit test
- KPI calculation test

---

## Observability Required
- feature_event_count
- conversion_delta
- badge_ctr

---

## Examples
Task: Verified Seller badge → Must:
- Track badge impression
- Define conversion target
- Compare verified vs non-verified

Task: Buyer protection badge → Must:
- Track badge CTR
- Define dispute reduction target
- Rate-limit tracking events
