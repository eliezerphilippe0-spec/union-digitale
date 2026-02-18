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
        <Card label="Trust CTR" value={formatPct(summary?.trustBadgeCTR)} />
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
