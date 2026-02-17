# Skill: architecture_guard

## Scope
Appliqué à :
- schema change
- migrations
- refactors
- feature flags
- backward compatibility
- versioning (Trust, Risk)

---

## Mandatory Invariants
1. No breaking change without migration plan.
2. Use feature flag for progressive rollout.
3. Preserve backward compatibility.
4. Snapshot data before structural refactor.
5. Version critical logic (ex: trustFormulaVersion).

---

## Refusal Rules
- If migration deletes data without backup.
- If breaking API without fallback.
- If refactor ignores existing flows.
- If no feature flag for major UI change.

---

## Implementation Checklist
- [ ] Migration file added
- [ ] Backfill script if needed
- [ ] Feature flag implemented
- [ ] Tests updated
- [ ] Documentation updated

---

## Tests Required
- Migration test
- Legacy fallback test
- Version compatibility test

---

## Observability Required
- migration_run_log
- feature_flag_usage
- version_distribution

---

## Examples
Task: Introduce OrderSub → Must:
- Keep legacy orders readable
- Add feature flag
- Snapshot commission

Task: Change trust formula → Must:
- Bump trustFormulaVersion
- Backfill existing stores
- Update admin monitoring
