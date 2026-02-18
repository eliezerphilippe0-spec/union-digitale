import React, { useEffect, useState } from 'react';
import { useAdminMetricsApi } from '../../api/adminMetrics';

const Card = ({ label, value, hint }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
    <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">{label}</div>
    <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{value ?? '-'}</div>
    {hint && <div className="text-xs text-slate-400 mt-2">{hint}</div>}
  </div>
);

const formatPct = (value) => `${((value || 0) * 100).toFixed(1)}%`;

const VERIFIED_STATUS_META = {
  SNAPSHOT: { label: 'Verified conv (SNAPSHOT)', color: 'green', hint: 'Calculated from order snapshot' },
  FALLBACK_JOIN: { label: 'Verified conv (FALLBACK)', color: 'yellow', hint: 'Calculated via store join' },
  FIRESTORE_DISABLED: { label: 'Verified conv (DISABLED)', color: 'gray', hint: 'Firestore disabled in backend' },
};

const VerifiedStatusChip = ({ status }) => {
  if (!status) return null;
  const meta = VERIFIED_STATUS_META[status] || VERIFIED_STATUS_META.FIRESTORE_DISABLED;
  const base = 'text-xs px-2 py-0.5 rounded-full border';
  const colorMap = {
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200',
  };
  return (
    <span className={`${base} ${colorMap[meta.color]}`} title={meta.hint}>
      {meta.label}
    </span>
  );
};

const AdminMetrics = () => {
  const api = useAdminMetricsApi();
  const [summary, setSummary] = useState(null);
  const [windowValue] = useState('7d');

  useEffect(() => {
    api.getSummary(windowValue).then(setSummary).catch(() => setSummary(null));
  }, [windowValue]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card label="AOV" value={summary?.aovConfirmed ?? 0} />
        <Card label="Revenue" value={summary?.revenueConfirmed ?? 0} />
        <Card label="Checkout completion" value={formatPct(summary?.rates?.checkoutCompletion)} />
        <Card label="Payment success" value={formatPct(summary?.rates?.paymentSuccess)} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card label="Upsell attach" value={formatPct(summary?.upsellAttachRate)} />
        <Card label="Pickup adoption" value={formatPct(summary?.pickupAdoptionRate)} />
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs uppercase tracking-wide text-slate-500">Verified conversion</div>
            <VerifiedStatusChip status={summary?.verifiedSellerUplift?.status || summary?.verifiedUpliftStatus} />
          </div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {formatPct(summary?.verifiedSellerUplift?.counts?.verified?.conversionRate)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Non‑verified: {formatPct(summary?.verifiedSellerUplift?.counts?.nonVerified?.conversionRate)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Snapshot coverage: {formatPct(summary?.verifiedSellerUplift?.snapshot?.coverageRate)}
          </div>
        </div>
        <Card label="Redirect drop" value={formatPct(summary?.redirectDropRate)} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card label="Cart → Checkout" value={formatPct(summary?.rates?.cartToCheckout)} />
        <Card label="Checkout starts" value={summary?.checkoutStarts ?? 0} />
        <Card label="Orders (paid)" value={summary?.ordersConfirmed ?? 0} />
        <Card label="Sessions" value={summary?.sessions ?? 0} />
      </div>
    </div>
  );
};

export default AdminMetrics;
