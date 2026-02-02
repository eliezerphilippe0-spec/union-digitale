# Union Digitale - Post-Migration Validation Checklist

## 🎯 Validation Criteria

All items must pass before considering migration complete.

---

## 1. ✅ Dashboard Uptime (100%)

### Vendor Dashboard
- [ ] Navigate to `/seller/dashboard`
- [ ] Verify page loads without errors
- [ ] Check all widgets render correctly
- [ ] Verify real-time stock updates work
- [ ] Test navigation between dashboard sections
- [ ] **Expected**: No crashes, <2s load time

### Buyer Dashboard
- [ ] Navigate to `/buyer/dashboard` or `/orders`
- [ ] Verify order history displays
- [ ] Check wallet balance shows correctly
- [ ] Test navigation to product catalog
- [ ] **Expected**: No crashes, smooth navigation

### Firebase Status
- [ ] Check Firebase Console > Hosting > Status
- [ ] Verify 100% uptime in last 24 hours
- [ ] Check for any error spikes in logs
- [ ] **Expected**: Green status, no incidents

**Status**: ⬜ PENDING | ✅ PASS | ❌ FAIL

---

## 2. 💰 MonCash Sandbox Tests (3 Transactions)

### Test 1: Product Purchase (25,000 HTG)
- [ ] Create test order for 25,000 HTG
- [ ] Process MonCash sandbox payment
- [ ] Verify webhook received (check Functions logs)
- [ ] Check order status updated to `paid`
- [ ] Verify vendor balance: **21,250 HTG (85%)**
- [ ] Verify platform revenue: **3,750 HTG (15%)**
- [ ] Confirm buyer notification sent

**Commission Split**:
```
Total: 25,000 HTG
├─ Vendor: 21,250 HTG (85%) ✅
└─ Platform: 3,750 HTG (15%) ✅
```

### Test 2: Multiple Items Order (50,000 HTG)
- [ ] Create order with 2+ products (total 50,000 HTG)
- [ ] Process MonCash payment
- [ ] Verify commission split per vendor
- [ ] Check each vendor receives correct 85% payout
- [ ] Verify platform receives 15% total

**Expected Splits**:
```
Vendor A (30,000 HTG): 25,500 HTG (85%)
Vendor B (20,000 HTG): 17,000 HTG (85%)
Platform Total: 7,500 HTG (15%)
```

### Test 3: Duplicate Payment Prevention
- [ ] Attempt to process same order twice
- [ ] Verify transaction lock prevents duplicate
- [ ] Check only one commission split created
- [ ] Confirm idempotency works correctly

**Status**: ⬜ PENDING | ✅ PASS | ❌ FAIL

---

## 3. ⚡ Real-time Stock Updates (<2s)

### Test Setup
- [ ] Open vendor stock dashboard
- [ ] Note current stock count for test product
- [ ] Open Firebase Console > Firestore

### Test Execution
1. **Manual Update**:
   - [ ] Update product stock in Firestore directly
   - [ ] Start timer
   - [ ] Observe dashboard update
   - [ ] **Expected**: Update visible in <2 seconds

2. **Purchase Update**:
   - [ ] Complete a test purchase
   - [ ] Observe stock decrement in dashboard
   - [ ] **Expected**: Real-time update, no page refresh needed

3. **Multiple Vendors**:
   - [ ] Test with 2+ vendor accounts simultaneously
   - [ ] Verify each sees only their products
   - [ ] Confirm no cross-vendor data leakage

**Performance Metrics**:
- Update Latency: _____ ms (Target: <2000ms)
- Firestore Listener: ✅ Active | ❌ Disconnected

**Status**: ⬜ PENDING | ✅ PASS | ❌ FAIL

---

## 4. 📱 Lighthouse Mobile Score (>90)

### Test Environment
- Device: Chrome DevTools > iPhone 12 Pro
- Network: Slow 3G throttling
- URL: Production homepage

### Run Lighthouse Audit
```bash
cd tests
npm install
npx playwright test --grep @lighthouse
```

### Required Scores
- [ ] **Performance**: ≥90 (Current: _____)
- [ ] **Accessibility**: ≥90 (Current: _____)
- [ ] **Best Practices**: ≥90 (Current: _____)
- [ ] **SEO**: ≥90 (Current: _____)

### SEO Checklist (Haiti/Canada)
- [ ] Meta title includes "Haiti" or "Canada"
- [ ] Meta description optimized for local search
- [ ] OpenGraph tags present
- [ ] Schema.org markup for marketplace
- [ ] Sitemap.xml accessible
- [ ] Robots.txt configured correctly

### Mobile Responsiveness
- [ ] Homepage renders correctly on mobile
- [ ] Product catalog scrollable
- [ ] Cart checkout flow works on mobile
- [ ] MonCash payment redirects work
- [ ] Touch targets ≥48px

**Status**: ⬜ PENDING | ✅ PASS | ❌ FAIL

---

## 5. 📊 Firebase Quotas (<80% Usage)

### Check Firebase Console
Navigate to: https://console.firebase.google.com/project/union-digitale-haiti

#### Firestore Usage
- [ ] Document Reads: _____% (Target: <80%)
- [ ] Document Writes: _____% (Target: <80%)
- [ ] Storage: _____% (Target: <80%)

#### Cloud Functions
- [ ] Invocations: _____% (Target: <80%)
- [ ] Execution Time: _____% (Target: <80%)
- [ ] Outbound Networking: _____% (Target: <80%)

#### Hosting
- [ ] Bandwidth: _____% (Target: <80%)
- [ ] Storage: _____% (Target: <80%)

### Monitoring Alerts
- [ ] Quota monitoring function deployed
- [ ] Test alert triggers at 80% threshold
- [ ] Admin receives notification
- [ ] Dashboard shows quota status

**Status**: ⬜ PENDING | ✅ PASS | ❌ FAIL

---

## 6. 🔒 Security Validation

### Firestore Rules
- [ ] Vendor can only read/write own products
- [ ] Buyer can only read own orders
- [ ] Admin has full access
- [ ] Anonymous users cannot write
- [ ] Transaction locks prevent spam

### Authentication
- [ ] Email verification required for MonCash
- [ ] Phone auth works for Haiti (+509)
- [ ] Role-based access enforced
- [ ] Session timeout configured

### API Security
- [ ] MonCash webhook signature verified
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] Environment variables secured

**Status**: ⬜ PENDING | ✅ PASS | ❌ FAIL

---

## 7. 📦 Backup and Version Control

### GitHub Backup
```bash
git add .
git commit -m "v1-claude-migrated: Phase 1 complete"
git tag v1-claude-migrated
git push origin main --tags
```

- [ ] All files committed to Git
- [ ] Tag `v1-claude-migrated` created
- [ ] Pushed to GitHub remote
- [ ] Repository URL: _____________________

### Firebase Backup
- [ ] Firestore export scheduled
- [ ] Storage bucket backup enabled
- [ ] Functions source code backed up
- [ ] Environment variables documented

**Status**: ⬜ PENDING | ✅ PASS | ❌ FAIL

---

## 8. 📝 Documentation

### Technical Documentation
- [ ] `README.md` updated with deployment steps
- [ ] `walkthrough.md` complete
- [ ] API documentation for MonCash webhook
- [ ] Environment variables documented

### User Documentation
- [ ] Vendor onboarding guide
- [ ] Buyer user manual
- [ ] MonCash payment instructions
- [ ] FAQ for Haiti/Canada users

**Status**: ⬜ PENDING | ✅ PASS | ❌ FAIL

---

## 9. 🚀 Production Readiness

### Pre-Launch Checklist
- [ ] MonCash production credentials configured
- [ ] MONCASH_MODE set to 'production'
- [ ] SSL certificate valid
- [ ] Custom domain configured (if applicable)
- [ ] Error monitoring active (Sentry/Stackdriver)
- [ ] Analytics tracking enabled
- [ ] Customer support email configured

### Rollback Plan
- [ ] Previous version tagged in Git
- [ ] Firebase Hosting rollback tested
- [ ] Database migration reversible
- [ ] Downtime communication plan ready

**Status**: ⬜ PENDING | ✅ PASS | ❌ FAIL

---

## ✅ Final Validation Summary

| Category | Status | Notes |
|----------|--------|-------|
| Dashboard Uptime | ⬜ | |
| MonCash Tests | ⬜ | |
| Real-time Updates | ⬜ | |
| Lighthouse Score | ⬜ | |
| Firebase Quotas | ⬜ | |
| Security | ⬜ | |
| Backup | ⬜ | |
| Documentation | ⬜ | |
| Production Ready | ⬜ | |

**Overall Status**: ⬜ NOT READY | ✅ READY FOR PRODUCTION | ⚠️ NEEDS ATTENTION

---

## 🎯 Sign-Off

**Validated By**: _____________________  
**Date**: _____________________  
**Signature**: _____________________

**Notes**:
```
[Add any additional notes, issues found, or recommendations here]
```

---

## 📞 Support Contacts

- **Technical Lead**: _____________________
- **Firebase Admin**: _____________________
- **MonCash Support**: support@moncash.com
- **Emergency Contact**: _____________________

---

**Next Steps After Validation**:
1. Schedule production deployment
2. Notify stakeholders of go-live date
3. Prepare customer communication
4. Monitor closely for first 48 hours
5. Gather user feedback
6. Plan Phase 2 enhancements
