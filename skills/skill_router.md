# Skill Router

## Routing Rules
Hard-coded mapping (deterministic):
- escrow/payout/refund/commission/ledger/balance → finance_guardian
- rules/auth/admin/role/permission/jwt/webhook → security_auditor
- query/index/pagination/firestore/limit/startAfter/N+1 → perf_optimizer
- migration/schema/refactor/version/flag/compatibility → architecture_guard
- badge/tracking/analytics/KPI/conversion/A-B → growth_engineer

## Algorithm
1. Input: task_description
2. Detect 1 primary skill + up to 2 secondary skills
3. Generate plan:
   - Checklist (from skill)
   - Risks
   - Required tests
   - Observability
4. STOP if refusal rules triggered
5. Log to /logs/skill_usage.log + DB SkillUsageEvent

## Output
- .skill/last_run.json with:
  - task
  - selectedSkill
  - secondarySkills
  - checklistStatus (PASSED | BLOCKED)
  - testsAdded (true/false)

## Logging
- Local: /logs/skill_usage.log (gitignored)
- DB: SkillUsageEvent (admin-only API)
