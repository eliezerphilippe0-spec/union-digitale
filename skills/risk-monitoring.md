# Skill: Risk Monitoring

- Key: risk.monitoring
- Owner: Risk & Trust
- Version: 1.0.0
- Status: active

## Purpose
Detect abnormal seller activity and trigger protective actions for the marketplace.

## Scope
Evaluates risk rules, aggregates signals, and generates risk events for admin review.

## Inputs
- storeId (string): seller store identifier
- window (string): evaluation window (e.g., 7d, 30d)
- signals (object): chargebacks, refunds, payout velocity, KYC status

## Outputs
- riskLevel (string): NORMAL | WATCH | HIGH | FROZEN
- events (array): triggered rule events with severity
- recommendation (string): suggested admin action

## Preconditions
- Store exists and has at least one completed order.
- Risk rule configuration is active.

## Side Effects
- Updates store riskLevel when thresholds are exceeded.
- Creates RiskEvent records for auditing.

## Guardrails
- Avoid auto-freeze without critical severity confirmation.
- Provide human override path for false positives.
- Never expose risk rules publicly.

## Logging
- Log storeId, triggered rules, and decision latency.
- Record any overrides separately for audit.

## Examples
- Input: { storeId: "store_abc", window: "7d" }
- Output: { riskLevel: "WATCH", events: [ ... ] }

## Ownership
- Primary: Risk Engineering
- Secondary: Compliance
