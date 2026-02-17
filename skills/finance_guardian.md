# Skill: finance_guardian

## Scope
Appliqué à toute logique liée à :
- escrow
- payout
- refund
- commission
- ledger
- wallet
- balance
- subOrders
- monetary snapshots

---

## Mandatory Invariants
1. No client-trusted monetary value.
   - price, commission, sellerNet must come from DB only.
2. All balance mutations must be transactional.
3. Every monetary mutation must create a ledger entry.
4. No negative balance allowed.
5. Idempotency required for:
   - webhooks
   - payout batch
   - refund
6. Snapshot financial data at creation (commissionBps, sellerNetAmount).
7. Rollback on any partial failure.

---

## Refusal Rules (STOP execution)
- If price comes from request body.
- If balance update happens without ledger entry.
- If no idempotency key/check exists.
- If transaction is not atomic.
- If payout logic ignores riskLevel or payoutsFrozen.
- If deliveredAt not used for payout eligibility.

---

## Implementation Checklist
- [ ] Use DB transaction
- [ ] Verify idempotency guard
- [ ] Validate no negative balances
- [ ] Write FinancialLedger event
- [ ] Snapshot commission & net amounts
- [ ] Add test covering edge case
- [ ] Add metric/log if needed

---

## Tests Required
- Double execution test
- Concurrent execution test
- Negative balance prevention
- Refund before/after release
- Batch double-run test

---

## Observability Required
- finance_invariant_violation
- payout_batch_createdCount
- payout_batch_skippedCount
- escrow_hold_totalHTG
- escrow_release_totalHTG

---

## Examples
Task: Add refund after release → Must:
- Reverse sellerNet
- Add ledger REVERSAL
- Prevent double refund
- Update balances atomically

Task: Add payout batch improvement → Must:
- Idempotency on batch run
- Ledger entry per payout
- Respect payoutsFrozen / riskLevel
- Prevent negative available balance
