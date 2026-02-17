# Skills System

Union Digitale uses a lightweight **skills system** to document high-impact workflows, track usage, and provide administrative visibility.

## Structure

- `skills/` contains one markdown file per skill.
- Each skill file **must** include the required sections below.
- Backend routes expose skill definitions and usage events.
- Admin UI is available at `/admin/skills`.

## Required Sections

Each `skills/*.md` file must include:

1. `# Skill: <Name>`
2. Metadata lines:
   - `- Key: <skill.key>`
   - `- Owner: <team>`
   - `- Version: <semver>`
   - `- Status: active | deprecated | draft`
3. `## Purpose`
4. `## Scope`
5. `## Inputs`
6. `## Outputs`
7. `## Preconditions`
8. `## Side Effects`
9. `## Guardrails`
10. `## Logging`
11. `## Examples`
12. `## Ownership`

## Validation (Enforcement)

Run the validator before committing:

```bash
node scripts/skills/validate-skills.cjs
```

Generate a demo output file (optional):

```bash
node scripts/skills/validate-skills.cjs --write
```

## Git Hooks

To enforce locally, enable the included git hook:

```bash
git config core.hooksPath .githooks
```

## Admin API

- `GET /api/skills` – list skill definitions
- `POST /api/skills/:skillKey/usage` – log usage event
- `GET /api/admin/skills/summary` – summary stats (admin)
- `GET /api/admin/skills/events` – usage events (admin)

## Demo Output

A sample run output is stored at `.skill/last_run.json`.
