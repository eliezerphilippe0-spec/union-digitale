# Skill: security_auditor

## Scope
Appliqué à :
- auth
- JWT
- admin endpoints
- Firestore rules
- permissions
- webhooks
- role validation

---

## Mandatory Invariants
1. All admin routes require role validation.
2. JWT userId must come from token, not body.
3. Firestore rules must follow least privilege.
4. Logs must be write-only when applicable.
5. Webhooks must validate signature.

---

## Refusal Rules
- If route trusts userId from body.
- If Firestore rule allows global read.
- If admin endpoint lacks role check.
- If webhook signature not verified.
- If sensitive collection allows client write.

---

## Implementation Checklist
- [ ] Validate role
- [ ] Validate input schema
- [ ] Ensure Firestore rules strict
- [ ] Log audit event
- [ ] Add auth test

---

## Tests Required
- Unauthorized access test
- Role mismatch test
- Firestore rule simulation
- Invalid webhook signature test

---

## Observability Required
- security_violation_attempt
- admin_action_log
- webhook_invalid_signature

---

## Examples
Task: Add admin verifySeller endpoint → Must:
- Require ADMIN role
- Log store_verified
- Block non-admin

Task: Update Firestore rules for messages → Must:
- Participant-only reads
- Sender-only writes
- No global reads
