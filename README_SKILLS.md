# README_SKILLS

## What this is
A deterministic Skill Router + enforcement layer that ensures every task follows a strict checklist before code or commit.

## How to use the router
```
node scripts/skill-router.ts --task "Add refund after release"
```
This writes `.skill/last_run.json` and logs the decision.

## How to force a skill (override)
```
node scripts/skill-router.ts --task "Add refund after release" --force security_auditor
```
Use only when the default routing is incorrect; the forced skill is still validated.

## How to add a new skill
1. Create `/skills/<skill>.md` with the 7 required sections.
2. Add routing keywords to `scripts/skill-router.ts`.
3. Update README_SKILLS.md with examples.

## Meaning of BLOCKED
`BLOCKED` means a refusal rule was triggered. You must fix the task scope or requirements before proceeding.

## Commit message policy
Use explicit commit prefixes:
- `feat(finance): ...`
- `fix(security): ...`
- `perf(firestore): ...`
- `feat(architecture): ...`
- `feat(growth): ...`

## Demo (required)
**Task:** “Ajouter refund après release”

Expected routing:
- Primary: finance_guardian
- Secondary: security_auditor

```
node scripts/skill-router.ts --task "Ajouter refund après release"
```
Output `.skill/last_run.json` (example):
```json
{
  "task": "Ajouter refund après release",
  "selectedSkill": "finance_guardian",
  "secondarySkills": ["security_auditor"],
  "checklistStatus": "PASSED",
  "testsAdded": true
}
```
Commit only passes if tests are added and checklistStatus is PASSED.


## Git hooks setup
Run: `git config core.hooksPath .githooks` to enable the pre-commit hook.
