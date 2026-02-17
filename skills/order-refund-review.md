# Skill: Order Refund Review

- Key: orders.refund_review
- Owner: Operations & Finance
- Version: 1.0.0
- Status: active

## Purpose
Review refund requests to ensure policy compliance before approving payouts.

## Scope
Handles manual and automated review steps for refund eligibility, fraud checks, and documentation.

## Inputs
- orderId (string): order identifier
- reasonCode (string): refund reason
- evidence (array): optional attachments or notes
- reviewerId (string): admin identifier

## Outputs
- decision (string): APPROVE | REJECT | ESCALATE
- notes (string): reviewer rationale
- updatedStatus (string): order refund status

## Preconditions
- Order is in a refundable state (PAID, SHIPPED, or DELIVERED with policy window).
- Reviewer has ADMIN role.

## Side Effects
- Creates audit entry in finance ledger.
- Notifies buyer and seller of decision.

## Guardrails
- Enforce refund policy windows by category.
- Require evidence for high-value refunds.
- Escalate when fraud score exceeds threshold.

## Logging
- Log decision, orderId, reviewerId, and latency.
- Redact sensitive payment identifiers.

## Examples
- Input: { orderId: "ORD-123", reasonCode: "DAMAGED" }
- Output: { decision: "APPROVE", updatedStatus: "REFUND_APPROVED" }

## Ownership
- Primary: Operations
- Secondary: Risk & Compliance
