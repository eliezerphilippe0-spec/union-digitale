# Disaster Recovery & Business Continuity Plan
## Union Digitale Backend

---

## 1. Overview

This document outlines the disaster recovery (DR) and business continuity (BC) plan for Union Digitale's Firebase-based backend infrastructure.

**Recovery Time Objective (RTO)**: 4 hours  
**Recovery Point Objective (RPO)**: 1 hour  
**Last Updated**: 2026-01-25

---

## 2. Backup Strategy

### 2.1 Firestore Backups

**Automated Daily Backups**:
```bash
# Configure in Firebase Console or via gcloud
gcloud firestore export gs://[BUCKET]/firestore-backups/$(date +%Y-%m-%d)
```

**Backup Schedule**:
- **Daily**: Full backup at 2:00 AM UTC
- **Weekly**: Full backup retained for 4 weeks
- **Monthly**: Full backup retained for 12 months

**Backup Locations**:
- Primary: `gs://union-digitale-backups/firestore/`
- Secondary: `gs://union-digitale-backups-dr/firestore/` (different region)

### 2.2 Firebase Storage Backups

**Automated Sync**:
```bash
# Daily sync to backup bucket
gsutil -m rsync -r -d gs://[PRIMARY-BUCKET] gs://[BACKUP-BUCKET]
```

**Versioning**: Enabled on all storage buckets (30-day retention)

### 2.3 Cloud Functions Code

**Version Control**:
- Git repository: GitHub (private)
- Automated backups: GitHub Actions daily
- Tagged releases for all deployments

### 2.4 Configuration Backups

**Secrets & Environment Variables**:
```bash
# Export Firebase config
firebase functions:config:get > config-backup-$(date +%Y-%m-%d).json

# Encrypt and store
gpg --encrypt --recipient admin@uniondigitale.com config-backup.json
```

---

## 3. Disaster Scenarios & Recovery Procedures

### 3.1 Scenario: Firestore Data Corruption

**Detection**:
- Monitoring alerts on data integrity
- User reports of missing/incorrect data

**Recovery Steps**:

1. **Assess Damage** (15 min)
   ```bash
   # Check affected collections
   firebase firestore:get /orders --limit 100
   ```

2. **Stop Writes** (5 min)
   - Deploy emergency Firestore rules to block writes
   - Display maintenance page

3. **Restore from Backup** (2-3 hours)
   ```bash
   # Restore from latest backup
   gcloud firestore import gs://union-digitale-backups/firestore/2026-01-25
   ```

4. **Verify Data** (30 min)
   - Run data integrity checks
   - Verify critical collections (orders, transactions, users)

5. **Resume Operations** (15 min)
   - Restore normal Firestore rules
   - Remove maintenance page
   - Monitor for issues

**Total RTO**: ~4 hours

### 3.2 Scenario: Cloud Functions Outage

**Detection**:
- Health check failures
- Increased error rates in Sentry
- User reports

**Recovery Steps**:

1. **Verify Outage** (5 min)
   ```bash
   # Check function status
   firebase functions:log --only createOrderSecure
   ```

2. **Rollback to Previous Version** (10 min)
   ```bash
   # List versions
   gcloud functions list --regions us-central1
   
   # Rollback
   firebase deploy --only functions:createOrderSecure --force
   ```

3. **Monitor Recovery** (15 min)
   - Check error rates
   - Verify function execution

**Total RTO**: ~30 minutes

### 3.3 Scenario: Complete Firebase Project Loss

**Detection**:
- Firebase Console inaccessible
- All services down

**Recovery Steps**:

1. **Create New Firebase Project** (30 min)
   ```bash
   firebase projects:create union-digitale-dr
   ```

2. **Restore Firestore Data** (3 hours)
   ```bash
   gcloud firestore import gs://union-digitale-backups-dr/firestore/latest
   ```

3. **Restore Storage** (2 hours)
   ```bash
   gsutil -m rsync -r gs://union-digitale-backups-dr/storage gs://[NEW-BUCKET]
   ```

4. **Deploy Cloud Functions** (1 hour)
   ```bash
   cd functions
   npm install
   firebase deploy --only functions
   ```

5. **Update DNS & Configuration** (30 min)
   - Update app configuration
   - Deploy new version
   - Update DNS records

6. **Verify & Test** (1 hour)
   - Run smoke tests
   - Verify critical flows
   - Monitor for issues

**Total RTO**: ~8 hours (exceeds target, requires manual intervention)

### 3.4 Scenario: Security Breach

**Detection**:
- Security alerts in Sentry
- Unusual activity patterns
- User reports of unauthorized access

**Immediate Actions** (within 15 min):

1. **Isolate Breach**
   ```bash
   # Deploy emergency Firestore rules (deny all)
   firebase deploy --only firestore:rules
   ```

2. **Revoke Compromised Credentials**
   - Rotate all API keys
   - Revoke suspicious user sessions
   - Disable compromised accounts

3. **Assess Impact**
   - Check audit logs
   - Identify affected users/data
   - Document timeline

**Recovery Steps**:

4. **Patch Vulnerability** (2-4 hours)
   - Fix security flaw
   - Deploy patched version
   - Run security tests

5. **Restore Data if Needed** (2-3 hours)
   - Restore from pre-breach backup
   - Merge legitimate transactions

6. **Notify Affected Users** (1 hour)
   - Email notifications
   - Password reset requirements
   - Incident report

**Total RTO**: ~6-8 hours

---

## 4. Backup Verification

### 4.1 Monthly Backup Tests

**Schedule**: First Sunday of each month

**Test Procedure**:
1. Restore backup to test environment
2. Run data integrity checks
3. Verify critical queries work
4. Document results

### 4.2 Quarterly DR Drills

**Schedule**: Every 3 months

**Drill Scenarios**:
- Firestore restore
- Cloud Functions rollback
- Complete project recovery (simulation)

---

## 5. Monitoring & Alerts

### 5.1 Critical Alerts

**Immediate Notification** (SMS + Email):
- Firestore quota exceeded (>95%)
- Cloud Functions error rate >10%
- Security breach detected
- Backup failure

**Email Only**:
- Firestore quota warning (>80%)
- Slow API responses (>3s)
- Failed health checks

### 5.2 Monitoring Dashboards

**Firebase Console**:
- Firestore usage
- Cloud Functions metrics
- Storage usage

**Sentry**:
- Error rates
- Performance metrics
- Security alerts

**Custom Dashboard** (Grafana):
- Transaction volumes
- API latency
- User activity

---

## 6. Contact Information

### 6.1 Emergency Contacts

**Primary On-Call**:
- Name: [DevOps Lead]
- Phone: +509-XXXX-XXXX
- Email: oncall@uniondigitale.com

**Secondary On-Call**:
- Name: [Backend Lead]
- Phone: +509-XXXX-XXXX
- Email: backend@uniondigitale.com

**Escalation**:
- CTO: cto@uniondigitale.com
- CEO: ceo@uniondigitale.com

### 6.2 Vendor Support

**Firebase Support**:
- Portal: https://firebase.google.com/support
- Priority: Blaze Plan (paid support)
- SLA: 4-hour response for P1 issues

**MonCash Support**:
- Phone: +509-XXXX-XXXX
- Email: support@moncashbutton.digicelgroup.com

**Stripe Support**:
- Portal: https://support.stripe.com
- Priority: Standard

---

## 7. Post-Incident Procedures

### 7.1 Incident Report

**Template**:
```markdown
# Incident Report: [TITLE]

**Date**: YYYY-MM-DD
**Duration**: X hours
**Severity**: P1/P2/P3
**Status**: Resolved/Ongoing

## Summary
[Brief description]

## Timeline
- HH:MM - [Event]
- HH:MM - [Action taken]

## Root Cause
[Analysis]

## Impact
- Users affected: X
- Revenue impact: $X
- Data loss: Yes/No

## Resolution
[Steps taken]

## Prevention
[Future improvements]

## Action Items
- [ ] Task 1 (Owner: Name, Due: Date)
- [ ] Task 2 (Owner: Name, Due: Date)
```

### 7.2 Post-Mortem Meeting

**Schedule**: Within 48 hours of incident resolution

**Attendees**:
- Engineering team
- Product team
- Customer support
- Management (for P1 incidents)

**Agenda**:
1. Incident timeline review
2. Root cause analysis
3. Impact assessment
4. Prevention strategies
5. Action item assignment

---

## 8. Continuous Improvement

### 8.1 Quarterly Reviews

**Review Items**:
- Backup success rate
- RTO/RPO compliance
- Incident frequency
- Recovery drill results

### 8.2 Plan Updates

**Triggers for Update**:
- Major architecture changes
- New services added
- Failed recovery drill
- Actual incident learnings

**Update Process**:
1. Draft changes
2. Team review
3. Management approval
4. Documentation update
5. Team training

---

## 9. Compliance & Audit

### 9.1 Backup Retention

**Compliance Requirements**:
- Financial data: 7 years
- User data: 3 years (or until deletion request)
- Audit logs: 1 year

### 9.2 Audit Trail

**Logged Events**:
- Backup creation/restoration
- Configuration changes
- Security incidents
- Access to sensitive data

**Log Retention**: 1 year in Firestore, 7 years in cold storage

---

## 10. Appendix

### 10.1 Useful Commands

**Firestore Export**:
```bash
gcloud firestore export gs://[BUCKET]/[PATH]
```

**Firestore Import**:
```bash
gcloud firestore import gs://[BUCKET]/[PATH]
```

**List Backups**:
```bash
gsutil ls gs://union-digitale-backups/firestore/
```

**Deploy Emergency Rules**:
```bash
# Create emergency.rules with deny all
firebase deploy --only firestore:rules --config emergency.rules
```

### 10.2 Checklist: Monthly Backup Verification

- [ ] Restore latest backup to test environment
- [ ] Verify user count matches production
- [ ] Verify order count matches production
- [ ] Run sample queries
- [ ] Check data integrity
- [ ] Document results
- [ ] Archive test data

---

**Document Version**: 1.0  
**Next Review Date**: 2026-04-25  
**Owner**: DevOps Team
